using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Hubs;

public class ChatHub : Hub
{
    private readonly UserRelatedContext _context;
    private readonly MessageValidationService _validationService;
    private readonly IMessageQueueService _messageQueueService;
    private readonly ContactService _contactService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(
        UserRelatedContext context,
        MessageValidationService validationService,
        IMessageQueueService messageQueueService,
        ContactService contactService,
        ILogger<ChatHub> logger)
    {
        _context = context;
        _validationService = validationService;
        _messageQueueService = messageQueueService;
        _contactService = contactService;
        _logger = logger;
    }

    /// <summary>
    /// 客户端连接时调用
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            // 将用户添加到其所在的所有聊天组
            var userChats = await GetUserChatsAsync(userId.Value);
            foreach (var chat in userChats)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, chat.UniqueMark);
            }

            _logger.LogInformation("用户 {UserId} 已连接到聊天中心，连接ID: {ConnectionId}", userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// 客户端断开连接时调用
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            // 从所有聊天组中移除用户
            var userChats = await GetUserChatsAsync(userId.Value);
            foreach (var chat in userChats)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, chat.UniqueMark);
            }

            _logger.LogInformation("用户 {UserId} 已断开连接，连接ID: {ConnectionId}", userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// 发送消息
    /// </summary>
    public async Task<SendMessageResponse> SendMessage(SendMessageRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return SendMessageResponse.Unauthorized("用户未认证");

        try
        {
            // 1. 验证消息内容
            var contentValidation = _validationService.ValidateMessageContent(request.Content);
            if (contentValidation.Result != EMessageSendResult.Success)
                return contentValidation;

            // 2. 确定聊天类型并验证权限
            var chat = await _context.Chats
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(c => c.UniqueMark == request.ChatUniqueMark);

            if (chat == null)
                return SendMessageResponse.ChatNotFound();

            SendMessageResponse validationResult;
            
            // 检查是否为私聊
            var privateChat = await _context.PrivateChats
                .FirstOrDefaultAsync(pc => pc.UniqueMark == request.ChatUniqueMark);
                
            if (privateChat != null)
            {
                // 私聊验证
                validationResult = await _validationService.ValidatePrivateChatMessageAsync(
                    request.ChatUniqueMark, userId.Value, request.ViaGroupChatId);
            }
            else
            {
                // 群聊验证
                validationResult = await _validationService.ValidateGroupChatMessageAsync(
                    request.ChatUniqueMark, userId.Value);
            }

            if (validationResult.Result != EMessageSendResult.Success)
                return validationResult;

            // 3. 创建消息对象
            var sender = await _context.Users.FindAsync(userId.Value);
            
            if (sender == null || chat == null)
                return SendMessageResponse.InternalError("发送者或聊天不存在");

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

            // 4. 将消息发送到消息队列
            await _messageQueueService.SendMessageAsync(message);

            // 5. 推送完整的Contact和Message对象给所有相关用户
            await PushUpdatedContactAndMessageAsync(request.ChatUniqueMark, userId.Value, message);

            _logger.LogInformation("用户 {UserId} 在聊天 {ChatId} 发送消息，消息ID: {MessageId}", 
                userId, request.ChatUniqueMark, message.TraceId);

            return SendMessageResponse.Success(new Guid(message.TraceId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "发送消息时发生错误，用户: {UserId}, 聊天: {ChatId}", 
                userId, request.ChatUniqueMark);
            return SendMessageResponse.InternalError(ex.Message);
        }
    }

    /// <summary>
    /// 加入聊天组
    /// </summary>
    public async Task JoinChat(string chatUniqueMark)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return;

        // 验证用户是否有权限加入该聊天
        var chat = await _context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);

        if (chat != null && chat.Contacts.Any(c => c.HostId == userId.Value))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatUniqueMark);
            _logger.LogInformation("用户 {UserId} 加入聊天组 {ChatId}", userId, chatUniqueMark);
        }
    }

    /// <summary>
    /// 离开聊天组
    /// </summary>
    public async Task LeaveChat(string chatUniqueMark)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatUniqueMark);
        var userId = GetCurrentUserId();
        _logger.LogInformation("用户 {UserId} 离开聊天组 {ChatId}", userId, chatUniqueMark);
    }

    /// <summary>
    /// 获取当前用户ID
    /// </summary>
    private Guid? GetCurrentUserId()
    {
        var userIdClaim = Context.User?.FindFirst("UserId");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// 获取用户所在的所有聊天
    /// </summary>
    private async Task<List<Chat>> GetUserChatsAsync(Guid userId)
    {
        return await _context.Chats
            .Include(c => c.Contacts)
            .Where(c => c.Contacts.Any(contact => contact.HostId == userId))
            .ToListAsync();
    }

    /// <summary>
    /// 推送完整的Contact和Message对象给所有相关用户
    /// </summary>
    private async Task PushUpdatedContactAndMessageAsync(string chatUniqueMark, Guid senderId, Message message)
    {
        try
        {
            // 获取聊天中的所有联系人（排除发送者）
            var contacts = await _context.Contacts
                .Include(c => c.Object)
                .Where(c => c.Object.UniqueMark == chatUniqueMark && c.HostId != senderId)
                .ToListAsync();

            foreach (var contact in contacts)
            {
                // 获取该用户的总未读计数
                var totalUnreadCount = await _contactService.GetTotalUnreadCountAsync(contact.HostId);
                
                // 创建简化的Contact对象（避免循环引用）
                var simplifiedContact = new
                {
                    ContactId = contact.ContactId,
                    HostId = contact.HostId,
                    ObjectId = contact.ObjectId,
                    LastUnreadCount = contact.LastUnreadCount,
                    LastUsed = contact.LastUsed,
                    AddTime = contact.AddTime,
                    IsPinned = contact.IsPinned,
                    IsBlocked = contact.IsBlocked,
                    DisplayName = contact.DisplayName,
                    HasVitalUnread = contact.HasVitalUnread
                };

                // 创建简化的Message对象（避免循环引用）
                var simplifiedMessage = new
                {
                    TraceId = message.TraceId,
                    Content = message.Content,
                    Info = message.Info,
                    Type = message.Type,
                    SentTimestamp = message.SentTimestamp,
                    ServerCaughtTimestamp = message.ServerCaughtTimestamp,
                    IsMentioningAll = message.IsMentioningAll,
                    MentionedUserGuids = message.MentionedUserGuids,
                    IsAnnouncement = message.IsAnnouncement,
                    SenderId = message.SenderId
                };
                
                // 推送完整的Contact和Message对象给该用户
                await Clients.User(contact.HostId.ToString()).SendAsync("ReceiveUpdatedContactAndMessage", new
                {
                    Contact = simplifiedContact,
                    Message = simplifiedMessage,
                    TotalUnreadCount = totalUnreadCount,
                    UpdateTime = DateTime.UtcNow
                });

                _logger.LogDebug("推送Contact和Message对象给用户 {UserId}, 聊天: {ChatId}, 消息ID: {MessageId}", 
                    contact.HostId, chatUniqueMark, message.TraceId);
            }

            _logger.LogInformation("已推送Contact和Message对象，聊天: {ChatId}, 影响用户数: {UserCount}", 
                chatUniqueMark, contacts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "推送Contact和Message对象失败，聊天: {ChatId}", chatUniqueMark);
        }
    }

    /// <summary>
    /// 推送未读计数更新给所有相关用户
    /// </summary>
    private async Task PushUnreadCountUpdateAsync(string chatUniqueMark, Guid senderId)
    {
        try
        {
            // 获取聊天中的所有联系人（排除发送者）
            var contacts = await _context.Contacts
                .Include(c => c.Object)
                .Where(c => c.Object.UniqueMark == chatUniqueMark && c.HostId != senderId)
                .ToListAsync();

            foreach (var contact in contacts)
            {
                // 获取该用户的总未读计数
                var totalUnreadCount = await _contactService.GetTotalUnreadCountAsync(contact.HostId);
                
                // 推送未读计数更新给该用户
                await Clients.User(contact.HostId.ToString()).SendAsync("UpdateUnreadCount", new
                {
                    ChatUniqueMark = chatUniqueMark,
                    UnreadCount = contact.LastUnreadCount,
                    TotalUnreadCount = totalUnreadCount,
                    UpdateTime = DateTime.UtcNow
                });

                _logger.LogDebug("推送未读计数更新给用户 {UserId}, 聊天: {ChatId}, 未读数: {Count}", 
                    contact.HostId, chatUniqueMark, contact.LastUnreadCount);
            }

            _logger.LogInformation("已推送未读计数更新，聊天: {ChatId}, 影响用户数: {UserCount}", 
                chatUniqueMark, contacts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "推送未读计数更新失败，聊天: {ChatId}", chatUniqueMark);
        }
    }

    /// <summary>
    /// 标记消息已读（客户端调用）
    /// </summary>
    public async Task MarkMessagesAsRead(string chatUniqueMark)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return;

        try
        {
            // 重置该聊天的未读计数
            await _contactService.ResetUnreadCountAsync(userId.Value, chatUniqueMark);

            // 获取更新后的Contact对象
            var contact = await _context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => c.Object.UniqueMark == chatUniqueMark && c.HostId == userId.Value);

            if (contact != null)
            {
                // 获取该用户的总未读计数
                var totalUnreadCount = await _contactService.GetTotalUnreadCountAsync(userId.Value);
                
                // 创建简化的Contact对象（避免循环引用）
                var simplifiedContact = new
                {
                    ContactId = contact.ContactId,
                    HostId = contact.HostId,
                    ObjectId = contact.ObjectId,
                    LastUnreadCount = contact.LastUnreadCount,
                    LastUsed = contact.LastUsed,
                    AddTime = contact.AddTime,
                    IsPinned = contact.IsPinned,
                    IsBlocked = contact.IsBlocked,
                    DisplayName = contact.DisplayName,
                    HasVitalUnread = contact.HasVitalUnread
                };
                
                // 推送更新的Contact对象给当前用户
                await Clients.Caller.SendAsync("ReceiveUpdatedContact", new
                {
                    Contact = simplifiedContact,
                    TotalUnreadCount = totalUnreadCount,
                    UpdateTime = DateTime.UtcNow
                });
            }

            _logger.LogInformation("用户 {UserId} 标记聊天 {ChatId} 消息已读", userId, chatUniqueMark);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "标记消息已读失败，用户: {UserId}, 聊天: {ChatId}", userId, chatUniqueMark);
        }
    }

    /// <summary>
    /// 获取用户所有聊天的未读计数（客户端调用）
    /// </summary>
    public async Task GetUnreadCounts()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return;

        try
        {
            var unreadCounts = await _contactService.GetUserUnreadCountsAsync(userId.Value);
            var totalUnreadCount = await _contactService.GetTotalUnreadCountAsync(userId.Value);

            await Clients.Caller.SendAsync("ReceiveUnreadCounts", new
            {
                UnreadCounts = unreadCounts,
                TotalUnreadCount = totalUnreadCount,
                UpdateTime = DateTime.UtcNow
            });

            _logger.LogDebug("发送未读计数给用户 {UserId}, 总未读数: {TotalCount}", userId, totalUnreadCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取未读计数失败，用户: {UserId}", userId);
        }
    }
}