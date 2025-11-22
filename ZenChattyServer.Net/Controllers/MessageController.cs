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
[Route("api/msg/[controller]")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly UserRelatedContext _context;
    private readonly MessageValidationService _validationService;
    private readonly IMessageQueueService _messageQueueService;
    private readonly MessageCacheService _messageCacheService;
    private readonly ILogger<MessageController> _logger;

    public MessageController(
        UserRelatedContext context,
        MessageValidationService validationService,
        IMessageQueueService messageQueueService,
        MessageCacheService messageCacheService,
        ILogger<MessageController> logger)
    {
        _context = context;
        _validationService = validationService;
        _messageQueueService = messageQueueService;
        _messageCacheService = messageCacheService;
        _logger = logger;
    }



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
            var contentValidation = _validationService.ValidateMessageContent(request.Content);
            if (contentValidation.Result != EMessageSendResult.Success)
            {
                return BadRequest(contentValidation);
            }

            // 根据聊天类型进行验证
            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.UniqueMark == request.ChatUniqueMark);
            if (chat == null)
            {
                return NotFound(SendMessageResponse.ChatNotFound());
            }

            SendMessageResponse validationResult;
            switch (chat)
            {
                case PrivateChat privateChat:
                    validationResult = await _validationService.ValidatePrivateChatMessageAsync(privateChat.UniqueMark, userId);
                    break;
                case GroupChat groupChat:
                    validationResult = await _validationService.ValidateGroupChatMessageAsync(groupChat.UniqueMark, userId);
                    break;
                default:
                    return BadRequest(SendMessageResponse.InternalError("Invalid chat type"));
            }

            if (validationResult.Result != EMessageSendResult.Success)
            {
                return BadRequest(validationResult);
            }

            // 创建消息对象
            var sender = await _context.Users.FindAsync(userId);
            if (sender == null)
            {
                return BadRequest(SendMessageResponse.InternalError("Sender does not exist"));
            }

            var message = new Message(sender, chat, request.Content)
            {
                TraceId = Guid.NewGuid().ToString(),
                Type = request.MessageType,
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc(),
                ServerCaughtTimestamp = DateTime.UtcNow.ToFileTimeUtc(),
                Info = request.Info ?? "",
                IsMentioningAll = request.IsMentioningAll,
                MentionedUserGuids = request.MentionedUserIds?.Select(id => id.ToString()).ToArray()
            };

            // 发送到消息队列
            await _messageQueueService.SendMessageAsync(message);

            _logger.LogInformation("User {UserId} sent message to chat {ChatId}, message ID: {MessageId}", 
                userId, request.ChatUniqueMark, message.TraceId);

            return Ok(SendMessageResponse.Success(new Guid(message.TraceId)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            return StatusCode(500, SendMessageResponse.InternalError("Server Error"));
        }
    }

    /// <summary>
    /// 获取聊天消息历史
    /// </summary>
    [HttpGet("history/{chatUniqueMark}")]
    public async Task<ActionResult<IEnumerable<Message>>> GetMessageHistory(
        string chatUniqueMark,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // 获取当前用户ID
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // 验证用户是否有权限访问该聊天
            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            if (chat == null)
            {
                return NotFound("Chat does not exist");
            }

            // 检查用户是否在聊天中
            var hasAccess = await CheckChatAccessAsync(chat, userId);
            if (!hasAccess)
            {
                return Forbid();
            }

            // 获取消息历史（缓存+数据库联合查询）
            var messages = await GetCombinedMessagesAsync(chatUniqueMark, page, pageSize);

            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting message history");
            return StatusCode(500, "Server Error");
        }
    }

    /// <summary>
    /// 检查用户是否有权限访问聊天
    /// </summary>
    private async Task<bool> CheckChatAccessAsync(Chat chat, Guid userId)
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
    /// 获取缓存+数据库联合消息历史
    /// </summary>
    private async Task<List<Message>> GetCombinedMessagesAsync(string chatUniqueMark, int page, int pageSize)
    {
        // frontend need to kill same message by comparing trace id
        // 1. 从缓存获取消息
        var cachedMessages = _messageCacheService.GetCachedMessages(chatUniqueMark);
        
        // 2. 计算需要从数据库获取的消息数量
        var totalMessagesNeeded = page * pageSize;
        var messagesFromDbNeeded = Math.Max(0, totalMessagesNeeded - cachedMessages.Count);
        
        // 3. 从数据库获取消息
        var dbMessages = new List<Message>();
        if (messagesFromDbNeeded > 0)
        {
            var dbPage = (int)Math.Ceiling((double)messagesFromDbNeeded / pageSize);
            dbMessages = await _context.Messages
                .Where(m => m.OfChatId == chatUniqueMark)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.SentTimestamp)
                .Skip((dbPage - 1) * pageSize)
                .Take(messagesFromDbNeeded)
                .ToListAsync();
        }
        
        // 4. 合并缓存和数据库消息
        var allMessages = cachedMessages.Concat(dbMessages)
            .OrderByDescending(m => m.SentTimestamp)
            .ToList();
        
        // 5. 分页处理
        var startIndex = (page - 1) * pageSize;
        var endIndex = Math.Min(startIndex + pageSize, allMessages.Count);
        
        if (startIndex >= allMessages.Count)
        {
            return new List<Message>();
        }
        
        var result = allMessages
            .Skip(startIndex)
            .Take(pageSize)
            .OrderBy(m => m.SentTimestamp) // 按时间正序返回
            .ToList();
        
        _logger.LogInformation("Get chat {ChatId} message history, cached: {CachedCount}, DB: {DbCount}, total: {TotalCount}, returned: {ResultCount}",
            chatUniqueMark, cachedMessages.Count, dbMessages.Count, allMessages.Count, result.Count);
        
        return result;
    }

    /// <summary>
    /// 获取未读消息数量
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
                var unreadCount = await _context.Messages
                    .CountAsync(m => m.OfChatId == chat.UniqueMark && 
                                   m.SentTimestamp > DateTime.UtcNow.AddDays(-1).ToFileTimeUtc()); // 最近一天的消息
                
                result[chat.UniqueMark] = unreadCount;
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread message count");
            return StatusCode(500, "Server Error");
        }
    }

    /// <summary>
    /// 获取用户的所有聊天
    /// </summary>
    private async Task<List<Chat>> GetUserChatsAsync(Guid userId)
    {
        var privateChats = await _context.PrivateChats
            .Where(pc => pc.InitById == userId || pc.ReceiverId == userId)
            .Cast<Chat>()
            .ToListAsync();

        var groupChats = await _context.GroupChats
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
            // 获取当前用户ID
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new BasicResponse { success = false, content = "Invalid user identity" });
            }

            // 查找消息
            var message = await _context.Messages
                .Include(m => m.Sender)
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

            // 检查用户是否有权限访问该聊天
            var hasAccess = await CheckChatAccessAsync(message.OfChat, userId);
            if (!hasAccess)
            {
                return BadRequest(new BasicResponse { success = false, content = "No access to this chat" });
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
            _context.Messages.Update(message);
            await _context.SaveChangesAsync();

            // 从缓存中移除消息
            _messageCacheService.RemoveMessage(message.OfChatId, message.TraceId);

            // 发送撤回通知到消息队列
            await SendRecallNotificationAsync(message);

            _logger.LogInformation("User {UserId} recalled message {MessageId} in chat {ChatId}", 
                userId, request.MessageTraceId, request.ChatUniqueMark);

            return Ok(new BasicResponse { success = true, content = "Message recalled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalling message");
            return StatusCode(500, new BasicResponse { success = false, content = "Server Error" });
        }
    }

    /// <summary>
    /// 检查撤回权限
    /// </summary>
    private async Task<bool> CheckRecallPermissionAsync(Message message, Guid userId)
    {
        // 发送者可以在3分钟内撤回
        var messageTime = DateTime.FromFileTimeUtc(message.SentTimestamp);
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
    private async Task SendRecallNotificationAsync(Message message)
    {
        try
        {
            // 创建撤回事件消息
            var recallEventMessage = new Message(message.Sender, message.OfChat, "")
            {
                TraceId = Guid.NewGuid().ToString(),
                Type = EMessageType.Event,
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc(),
                ServerCaughtTimestamp = DateTime.UtcNow.ToFileTimeUtc(),
                Info = $"{{\"eventType\":\"messageRecalled\",\"originalMessageId\":\"{message.TraceId}\"}}"
            };

            // 发送到消息队列
            await _messageQueueService.SendMessageAsync(recallEventMessage);

            _logger.LogInformation("Recall notification sent for message {MessageId}", message.TraceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending recall notification");
        }
    }
}