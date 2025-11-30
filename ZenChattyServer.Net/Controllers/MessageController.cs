using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Controllers;

/// <summary>
/// 消息收发API控制器
/// </summary>
[ApiController]
[Route("api/msg")]
[Authorize]
public class MessageController(
    UserRelatedContext context,
    MessageValidationService validationService,
    IMessageQueueService messageQueueService,
    MessageCacheService messageCacheService,
    ILogger<MessageController> logger,
    AuthService authService    
)
    : AuthedControllerBase (authService)
{
    /// <summary>
    /// 发送消息 
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<SendMessageResponse>> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            // 获取当前用户ID
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(SendMessageResponse.Unauthorized("Invalid user identity"));
            }

            // 验证消息内容
            var contentValidation = validationService.ValidateMessageContent(request.Content);
            if (contentValidation.ResultCanBe != EMessageSendResult.Success)
            {
                return BadRequest(contentValidation);
            }

            // 根据聊天类型进行验证
            var chat = await context.Chats.FirstOrDefaultAsync(c => c.UniqueMark == request.ChatUniqueMark);
            if (chat == null)
            {
                return NotFound(SendMessageResponse.ChatNotFound());
            }

            SendMessageResponse validationResult;
            switch (chat)
            {
                case PrivateChat privateChat:
                    validationResult = await validationService.ValidatePrivateChatMessageAsync(privateChat.UniqueMark, userId);
                    
                    if (validationResult.ResultCanBe == EMessageSendResult.Success)
                    {
                        // 验证非好友关系的消息类型
                        var messageTypeValidationResult = await validationService.ValidateMessageTypeForNonFriendAsync(
                            privateChat.UniqueMark, userId, request.MessageType, request.ViaGroupChatId);
                        if (messageTypeValidationResult.ResultCanBe != EMessageSendResult.Success)
                            return BadRequest(messageTypeValidationResult);
                    }
                    break;
                case GroupChat groupChat:
                    validationResult = await validationService.ValidateGroupChatMessageAsync(groupChat.UniqueMark, userId);
                    break;
                default:
                    return BadRequest(SendMessageResponse.InternalError("Invalid chat type"));
            }

            if (validationResult.ResultCanBe != EMessageSendResult.Success)
            {
                return BadRequest(validationResult);
            }

            // 创建消息对象
            var sender = await context.Users.FindAsync(userId);
            if (sender == null)
            {
                return BadRequest(SendMessageResponse.InternalError("Sender does not exist"));
            }

            var message = new Message(sender, chat, request.Content)
            {
                TraceId = Guid.NewGuid().ToString(),
                Type = request.MessageType,
                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ServerCaughtTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Info = request.Info ?? "",
                IsMentioningAll = request.IsMentioningAll,
                MentionedUserGuids = request.MentionedUserIds?.Select(id => id.ToString()).ToArray()
            };

            // 发送到消息队列
            await messageQueueService.SendMessageAsync(message);

            logger.LogInformation("User {UserId} sent message to chat {ChatId}, message ID: {MessageId}", 
                userId, request.ChatUniqueMark, message.TraceId);

            return Ok(SendMessageResponse.Success(new Guid(message.TraceId)));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending message");
            return StatusCode(500, SendMessageResponse.InternalError("Server Error"));
        }
    }

    /// <summary>
    /// 获取聊天消息历史
    /// </summary>
    [HttpGet("history/{chatUniqueMark}")]
    public async Task<ActionResult<IEnumerable<Message>>> GetMessageHistory(
        string chatUniqueMark,
        [FromQuery] [Required] int queryMessageAmount,
        [FromQuery] [Required] long fromTimestamp)
    {
        try
        {
            // 获取当前用户ID
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();
            

            // 验证用户是否有权限访问该聊天
            var chat = await context.Chats.FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            if (chat == null) return NotFound("Chat does not exist");
            

            // 检查用户是否在聊天中
            var hasAccess = CheckChatAccess(chat, userId);
            if (!hasAccess) return Forbid();

            // 获取消息历史（基于时间戳的分页查询）
            var messages = await GetMessagesByTimestampAsync(chatUniqueMark, queryMessageAmount, fromTimestamp);

            return Ok(messages);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting message history");
            return StatusCode(500, "Server Error");
        }
    }

    /// <summary>
    /// 检查用户是否有权限访问聊天
    /// </summary>
    private static bool CheckChatAccess(Chat chat, Guid userId)
    {
        return chat switch
        {
            PrivateChat privateChat => 
                privateChat.InitById == userId || privateChat.ReceiverId == userId,
            GroupChat groupChat => 
                groupChat.Members.Any(m => m.TheGuyId == userId),
            _ => false
        };
    }

    /// <summary>
    /// 基于时间戳获取消息历史
    /// </summary>
    private async Task<List<Message>> GetMessagesByTimestampAsync(string chatUniqueMark, int queryMessageAmount, long fromTimestamp)
    {
        // 确保时间戳为毫秒级
        var timestampMs = fromTimestamp > 0 ? fromTimestamp : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        
        // 1. 从缓存获取消息（按时间戳过滤）
        var cachedMessages = messageCacheService.GetCachedMessages(chatUniqueMark)
            .Where(m => m.SentTimestamp < timestampMs) // 获取指定时间戳之前的消息
            .OrderByDescending(m => m.SentTimestamp)
            .Take(queryMessageAmount)
            .ToList();
        
        // 2. 如果缓存消息不足，从数据库获取更多消息
        var dbMessages = new List<Message>();
        if (cachedMessages.Count < queryMessageAmount)
        {
            var messagesNeeded = queryMessageAmount - cachedMessages.Count;
            
            dbMessages = await context.Messages
                .Where(m => m.OfChatId == chatUniqueMark && m.SentTimestamp < timestampMs)
                .OrderByDescending(m => m.SentTimestamp)
                .Take(messagesNeeded)
                .ToListAsync();
        }
        
        // 3. 合并缓存和数据库消息，按时间戳降序排序
        var allMessages = cachedMessages.Concat(dbMessages)
            .OrderByDescending(m => m.SentTimestamp)
            .Take(queryMessageAmount)
            .ToList();
        
        // 4. 按时间正序返回给客户端
        var result = allMessages
            .OrderBy(m => m.SentTimestamp)
            .ToList();
        
        logger.LogInformation("""
                               Get chat {ChatId} message history by timestamp: ...
                               | fromTimestamp: {FromTimestamp},
                               | queryAmount: {QueryAmount},
                               | cached: {CachedCount}, 
                               | DB: {DbCount}, 
                               | total: {TotalCount}, 
                               | returned: {ResultCount}
                               """,
            chatUniqueMark, timestampMs, queryMessageAmount, cachedMessages.Count, dbMessages.Count, allMessages.Count, result.Count);
        
        return result;
    }

    /// <summary>
    /// 获取未读消息数量 todo !!! maybe need refracture to get all unread msgs... if need to be pushed to NSrvs as total-unread in notification?  
    /// </summary>
    [HttpGet("unread/count")]
    public async Task<ActionResult<Dictionary<string, int>>> GetUnreadMessageCount()
    {
        try
        {
            // 获取当前用户ID
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // 获取用户的所有聊天
            var userChats = await GetUserChatsAsync(userId);
            var result = new Dictionary<string, int>();

            foreach (var chat in userChats)
            {
                // 这里简化处理，实际应该根据用户最后阅读时间计算未读消息
                var unreadCount = await context.Messages
                    .CountAsync(m => m.OfChatId == chat.UniqueMark && 
                                   m.SentTimestamp > DateTimeOffset.UtcNow.AddDays(-1).ToUnixTimeMilliseconds()); // 最近一天的消息
                
                result[chat.UniqueMark] = unreadCount;
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting unread message count");
            return StatusCode(500, "Server Error");
        }
    }

    /// <summary>
    /// 获取用户的所有聊天
    /// </summary>
    private async Task<List<Chat>> GetUserChatsAsync(Guid userId)
    {
        var privateChats = await context.PrivateChats
            .Where(pc => pc.InitById == userId || pc.ReceiverId == userId)
            .Cast<Chat>()
            .ToListAsync();

        var groupChats = await context.GroupChats
            .Include(gc => gc.Members)
            .Where(gc => gc.Members.Any(m => m.TheGuyId == userId))
            .Cast<Chat>()
            .ToListAsync();

        return privateChats.Concat(groupChats).ToList();
    }

    /// <summary>
    /// 撤回消息
    /// </summary>
    [HttpPost("recall")]
    public async Task<ActionResult<BasicResponse>> RecallMessage([FromBody] RecallMessageRequest request)
    {
        try
        {
            var refer = await AuthenticateAsync();
            if (refer.failResult != null) return Unauthorized(refer.failResult);

            var userId = refer.user!.LocalId;

            // 查找消息
            var message = await context.Messages
                .Include(m => m.OfChat)
                .FirstOrDefaultAsync(m => m.TraceId == request.MessageTraceId);

            if (message == null)
            {
                return NotFound(new BasicResponse { success = false, content = "Message not found" });
            }

            // 验证聊天ID匹配
            if (message.OfChatId != request.ChatUniqueMark)
            {
                return BadRequest(new BasicResponse { success = false, content = "Message does not belong to specified chat" });
            }

            // 检查撤回权限
            var canRecall = await CheckRecallPermissionAsync(message, userId);
            if (!canRecall)
            {
                return BadRequest(new BasicResponse { success = false, content = "No permission to recall this message" });
            }

            // 检查消息是否已经被撤回
            if (message.IsCanceled)
            {
                return BadRequest(new BasicResponse { success = false, content = "Message is already recalled" });
            }

            // 撤回消息：将消息类型改为Canceled
            message.Type = EMessageType.Canceled;
            message.IsCanceled = true;

            // 更新数据库
            context.Messages.Update(message);
            await context.SaveChangesAsync();

            // 更新缓存中的消息（标记为Canceled）
            messageCacheService.CacheMessage(message);

            // 发送撤回通知到消息队列
            await SendRecallNotificationAsync(message, refer.user!);

            logger.LogInformation("User {UserId} recalled message {MessageId} in chat {ChatId}", 
                userId, request.MessageTraceId, request.ChatUniqueMark);

            return Ok(new BasicResponse { success = true, content = "Message recalled successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recalling message");
            return StatusCode(500, new BasicResponse { success = false, content = "Server Error" });
        }
    }

    /// <summary>
    /// 检查撤回权限
    /// </summary>
    private async Task<bool> CheckRecallPermissionAsync(Message message, Guid userId)
    {
        // 发送者可以在3分钟内撤回
        var messageTime = DateTimeOffset.FromUnixTimeMilliseconds(message.SentTimestamp).UtcDateTime;
        var timeSinceSent = DateTime.UtcNow - messageTime;
        
        if (message.SenderId == userId && timeSinceSent <= TimeSpan.FromMinutes(3))
        {
            return true;
        }

        // 群聊的管理员或创建者可以随时撤回
        if (message.OfChat is GroupChat groupChat)
        {
            var member = groupChat.Members.FirstOrDefault(m => m.TheGuyId == userId);
            if (member != null && (member.Type == EGroupMemberType.Admin || member.Type == EGroupMemberType.Owner))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// 发送撤回通知
    /// </summary>
    private async Task SendRecallNotificationAsync(Message message, User origin)
    {
        try
        {
            // 创建撤回事件消息
            var recallEventMessage = new Message(origin, message.OfChat, "")
            {
                TraceId = Guid.NewGuid().ToString(),
                Type = EMessageType.Event,
                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ServerCaughtTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Info = $"{{\"eventType\":\"messageRecalled\",\"originalMessageId\":\"{message.TraceId}\"}}"
            };

            // 发送到消息队列
            await messageQueueService.SendMessageAsync(recallEventMessage);

            logger.LogInformation("Recall notification sent for message {MessageId}", message.TraceId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending recall notification");
        }
    }
}