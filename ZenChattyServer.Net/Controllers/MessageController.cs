using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Shared;
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
// [Authorize]
public class MessageController(
    UserRelatedContext context,
    MessageValidationService validationService,
    IMessageQueueService messageQueueService,
    MessageCacheService messageCacheService,
    ILogger<MessageController> logger,
    ChatHubService chatHub,
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
        var where = "nowhere";
        try
        {
            Console.Error.WriteLine("@ Sending message through HTTP API");
            var passIt = false;
            var isTestingRequest = Request.Headers.Authorization == "Bearer test";
            
            #if DEBUG
                passIt = true;
                Console.WriteLine($"DEBUG {passIt}, {isTestingRequest}, {Request.Headers.Authorization}");
            #endif

            where = "1";
            var refer = await AuthenticateAsync();
            if (refer.failResult != null && !passIt && !isTestingRequest) return Unauthorized(refer.failResult);
            // if failed, and not passing it, and not test, return failure
            
            where = "2";
            
            User? sender;
            if (passIt && isTestingRequest)
            {
                sender = await context.Users.FirstOrDefaultAsync(u => u.CustomId == Constants.SystemUser.CustomId);
            } else sender = refer.user!; // if test, if in debug, directly give stored 

            where = "3";
            if (sender == null && isTestingRequest) throw new NullReferenceException("System User Not Ready");
            where = $"3+ {sender is null} {sender?.LocalId is null} {sender?.CustomId} TRQ?{isTestingRequest}";

            var userId = sender!.LocalId;
            
            Console.WriteLine($"[incoming test request]: {userId}: System User");

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
            
            // var sender = await context.Users.FindAsync(userId);
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
            
            Console.WriteLine($"created::{message.OfChatId} {message.OfChat.UniqueMark}");

            // 发送到消息队列
            await messageQueueService.SendMessageAsync(message);
            await ChatAgent.Say(context, message, chatHub);

            logger.LogInformation("User {UserId} sent message to chat {ChatId}, message ID: {MessageId}", 
                userId, request.ChatUniqueMark, message.TraceId);

            return Ok(SendMessageResponse.Success(new Guid(message.TraceId)));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error sending message: {where}");
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
            // var userIdClaim = User.FindFirst("userId")?.Value;
            // if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            //     return Unauthorized();
            var refer = await AuthenticateAsync();
            if (refer.failResult != null) return Unauthorized(refer.failResult);

            var userId = refer.user!.LocalId;

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
                groupChat.Members.Any(m => m.TheGuyId == userId), // todo 这个方法仅用于获取聊天记录，所以就算聊天禁用、被屏蔽，也仍然可以看到历史消息（不涉及会出现新的消息的情况）
            _ => false // todo 看起来被踢出是无法查看历史消息的，因为不存储何时被踢出。算了，就当保护群聊本身不会进一步泄露吧
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
    /// 撤回消息
    /// </summary> todo 实在不行就不做撤回了。我真的很累了。
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
    /// 检查撤回权限  todo 可以不做的。留着吧，有人想来做就让他来做。
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

            // 发送到消息队列 todo 本意是直接更新消息，把撤回相关的必要消息更新到Message.Info
            await messageQueueService.SendMessageAsync(recallEventMessage);

            logger.LogInformation("Recall notification sent for message {MessageId}", message.TraceId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending recall notification");
        }
    }
}