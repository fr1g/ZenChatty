using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;
using ZenChattyServer.Net.Models.Events;

namespace ZenChattyServer.Net.Hubs;

public class ChatHub(
    UserRelatedContext context,
    MessageValidationService validationService,
    IMessageQueueService messageQueueService,
    ContactService contactService,
    ILogger<ChatHub> logger)
    : Hub
{
    #region 连接与断开连接，身份管理，事件工具
        /// <summary>
    /// 模拟用户发送消息（系统调用）
    /// </summary>
    public async Task SendMessageAsUser(
        string chatUniqueMark, 
        Guid senderId, 
        string content, 
        EMessageType messageType = EMessageType.Normal
    )
    {
        try
        {
            // 1. 验证聊天存在
            var chat = await context.Chats
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);

            if (chat == null)
            {
                logger.LogWarning("模拟发送消息失败：聊天 {ChatId} 不存在", chatUniqueMark);
                return;
            }

            // 2. 验证发送者存在且是聊天成员
            var sender = await context.Users.FindAsync(senderId);
            if (sender == null)
            {
                logger.LogWarning("模拟发送消息失败：发送者 {SenderId} 不存在", senderId);
                return;
            }

            var isMember = await context.Contacts
                .AnyAsync(c => c.ObjectId == chat.UniqueMark && c.HostId == senderId);
        
            if (!isMember)
            {
                logger.LogWarning("模拟发送消息失败：用户 {SenderId} 不是聊天 {ChatId} 的成员", senderId, chatUniqueMark);
                return;
            }

            // 3. 创建消息对象
            var message = new Message(sender, chat, content)
            {
                TraceId = Guid.NewGuid().ToString(),
                Type = messageType,
                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ServerCaughtTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Info = "",
                IsMentioningAll = false,
                MentionedUserGuids = null
            };

            // 4. 将消息发送到消息队列
            await messageQueueService.SendMessageAsync(message);

            // 5. 增加聊天中所有联系人的未读计数（排除发送者自己）
            await contactService.IncreaseUnreadCountAsync(chatUniqueMark, senderId);

            // 6. 推送完整的Contact和Message对象给所有相关用户
            await PushMessage(chatUniqueMark, senderId, message);

            logger.LogInformation("模拟用户 {SenderId} 在聊天 {ChatId} 发送消息，消息ID: {MessageId}", 
                senderId, chatUniqueMark, message.TraceId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "模拟发送消息时发生错误，发送者: {SenderId}, 聊天: {ChatId}", 
                senderId, chatUniqueMark);
        }
    }
    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            // 将用户添加到其所在的所有聊天组
            var userChats = await GetUserChatsAsync(userId.Value);
            if (userChats.Count > 0) foreach (var chat in userChats)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, chat.UniqueMark);
            }

            var user = context.Users.First(u => u.LocalId == userId);
            if (user.Status == EUserStatus.Offline)
            {
                user.Status = EUserStatus.Online;
                context.Users.Update(user);
                await context.SaveChangesAsync();
            }
            logger.LogInformation("用户 {UserId} 已连接到聊天中心，连接ID: {ConnectionId}", userId, Context.ConnectionId);
        }
        else
        {
            Console.WriteLine($"User {userId} ??????");
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
            
            var user = context.Users.First(u => u.LocalId == userId);
            if (user.Status == EUserStatus.Online)
            {
                user.Status = EUserStatus.Offline;
                context.Users.Update(user);
                await context.SaveChangesAsync();
            }
            logger.LogInformation("用户 {UserId} 已断开连接，连接ID: {ConnectionId}", userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }
        /// <summary>
    /// 获取当前用户ID
    /// </summary>
    private Guid? GetCurrentUserId()
    {
        // 调试信息：显示Context.User的详细信息
        Console.WriteLine($"=== GetCurrentUserId 调试信息 ===");
        Console.WriteLine($"Connection ID: {Context.ConnectionId}");
        Console.WriteLine($"Context.User is null: {Context.User == null}");
        
        if (Context.User != null)
        {
            Console.WriteLine($"Context.User.Identity.Name: {Context.User.Identity?.Name}");
            Console.WriteLine($"Context.User.Identity.IsAuthenticated: {Context.User.Identity?.IsAuthenticated}");
            Console.WriteLine($"Context.User.Claims count: {Context.User.Claims.Count()}");
            
            // 显示所有声明
            foreach (var claim in Context.User.Claims)
            {
                Console.WriteLine($"Claim Type: {claim.Type}, Value: {claim.Value}");
            }
            
            // 检查是否有access_token查询参数
            var httpContext = Context.GetHttpContext();
            if (httpContext != null)
            {
                var accessToken = httpContext.Request.Query["access_token"].FirstOrDefault();
                Console.WriteLine($"access_token query parameter: {accessToken}");
                
                // 检查Authorization头
                var authHeader = httpContext.Request.Headers["Authorization"].FirstOrDefault();
                Console.WriteLine($"Authorization header: {authHeader}");
            }
        }
        
        // original running
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier); // todo can save to constants
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            Console.WriteLine($"找到UserId声明: {userId}");
            return userId;
        }
        
        Console.WriteLine($"未找到有效的UserId声明");
        return null;
    }

    /// <summary>
    /// 获取用户所在的所有聊天
    /// </summary>
    private async Task<List<Chat>> GetUserChatsAsync(Guid userId)
    {
        // instant
        Console.WriteLine($"Instantly query all available chats: {userId}");
        return await context.Chats
            .Include(c => c.Contacts)
            .Where(c => c.Contacts.Any(contact => contact.HostId == userId))
            .ToListAsync();
    }
    #endregion
    
    #region 客户端发起的事件
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
            var contentValidation = validationService.ValidateMessageContent(request.Content);
            if (contentValidation.ResultCanBe != EMessageSendResult.Success)
                return contentValidation;

            // 2. 确定聊天类型并验证权限
            var chat = await context.Chats
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(c => c.UniqueMark == request.ChatUniqueMark);

            if (chat == null)
                return SendMessageResponse.ChatNotFound();

            SendMessageResponse validationResult;
            
            // 检查是否为私聊
            var privateChat = await context.PrivateChats
                .FirstOrDefaultAsync(pc => pc.UniqueMark == request.ChatUniqueMark);
                
            if (privateChat != null)
            {
                // 私聊验证
                validationResult = await validationService.ValidatePrivateChatMessageAsync(
                    request.ChatUniqueMark, userId.Value, request.ViaGroupChatId);
            }
            else
            {
                // 群聊验证
                validationResult = await validationService.ValidateGroupChatMessageAsync(
                    request.ChatUniqueMark, userId.Value);
            }

            if (validationResult.ResultCanBe != EMessageSendResult.Success)
                return validationResult;

            // 3. 创建消息对象
            var sender = await context.Users.FindAsync(userId.Value);
            
            if (sender == null)
                return SendMessageResponse.InternalError("发送者或聊天不存在");

            var message = new Message(sender, chat, request.Content)
            {
                TraceId = Guid.NewGuid().ToString(),
                Type = request.MessageType,
                SentTimestamp = request.SentTimestamp,
                ServerCaughtTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Info = request.Info ?? "",
                IsMentioningAll = request.IsMentioningAll,
                MentionedUserGuids = request.MentionedUserIds?.Select(id => id.ToString()).ToArray()
            };

            // 4. 将消息发送到消息队列
            await messageQueueService.SendMessageAsync(message);

            // 5. 增加聊天中所有联系人的未读计数（排除发送者自己）
            await contactService.IncreaseUnreadCountAsync(request.ChatUniqueMark, userId.Value);

            // 6. 推送完整的Contact和Message对象给所有相关用户
            await PushMessage(request.ChatUniqueMark, userId.Value, message);

            logger.LogInformation("用户 {UserId} 在聊天 {ChatId} 发送消息，消息ID: {MessageId}", 
                userId, request.ChatUniqueMark, message.TraceId);

            return SendMessageResponse.Success(new Guid(message.TraceId));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "发送消息时发生错误，用户: {UserId}, 聊天: {ChatId}", 
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
        var chat = await context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);

        if (chat != null && chat.Contacts.Any(c => c.HostId == userId.Value && !c.IsBlocked))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatUniqueMark);
            logger.LogInformation("用户 {UserId} 加入聊天组 {ChatId}", userId, chatUniqueMark);
        }
    }

    /// <summary>
    /// 离开聊天组
    /// </summary>
    public async Task LeaveChat(string chatUniqueMark)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatUniqueMark);
        var userId = GetCurrentUserId();
        logger.LogInformation("用户 {UserId} 离开聊天组 {ChatId}", userId, chatUniqueMark);
    }

    #endregion





    /// <summary>
    /// 服务端->客户端（实现）：出现了新的消息。
    /// 如果用户正在接收某个聊天的消息，推送这单条新消息到客户端。
    /// 此方法需要被重构但是没有确认实现。
    /// </summary>
    private async Task PushMessage(string chatUniqueMark, Guid senderId, Message message)
    {
        try
        {
            var contacts = await context.Contacts
                .Include(c => c.Object)
                .Where(c => 
                            c.Object.UniqueMark == chatUniqueMark && 
                            c.HostId != senderId && 
                            !c.IsBlocked)
                .ToListAsync();

            foreach (var contact in contacts) // this in here actually only runs once per call
            {
                // 获取该用户的总未读计数
                var totalUnreadCount = await contactService.GetTotalUnreadCountAsync(contact.HostId);
                
                // 从数据库中获取该聊天的真实未读计数，而不是内存自增
                var realUnreadCount = await context.Contacts
                    .Where(c => c.ContactId == contact.ContactId)
                    .Select(c => c.LastUnreadCount)
                    .FirstOrDefaultAsync();
                
                // 创建简化的Contact对象（避免循环引用）
                var simplifiedContact = new
                {
                    ContactId = contact.ContactId,
                    HostId = contact.HostId,
                    ObjectId = contact.ObjectId,
                    LastUnreadCount = realUnreadCount,
                    LastUsed = DateTime.Now,
                    AddTime = contact.AddTime,
                    IsPinned = contact.IsPinned,
                    IsBlocked = contact.IsBlocked,
                    DisplayName = contact.DisplayName,
                    HasVitalUnread = contact.HasVitalUnread
                };

                // 简化 todo 没有同步新的参数
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

                logger.LogDebug("推送Contact和Message对象给用户 {UserId}, 聊天: {ChatId}, 消息ID: {MessageId}", 
                    contact.HostId, chatUniqueMark, message.TraceId);
            }

            logger.LogInformation("已推送Contact和Message对象，聊天: {ChatId}, 影响用户数: {UserCount}", 
                chatUniqueMark, contacts.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "推送Contact和Message对象失败，聊天: {ChatId}", chatUniqueMark);
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
            await contactService.ResetUnreadCountAsync(userId.Value, chatUniqueMark);

            // 获取更新后的Contact对象
            var contact = await context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => c.Object.UniqueMark == chatUniqueMark && c.HostId == userId.Value);

            if (contact != null)
            {
                // 获取该用户的总未读计数
                var totalUnreadCount = await contactService.GetTotalUnreadCountAsync(userId.Value);
                contact.LastUsed = DateTime.UtcNow;
                
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

                context.Contacts.Update(contact);
                await context.SaveChangesAsync(); // 我总觉得我引入缓存就是乱增实体。。。
                
                // 推送更新的Contact对象给当前用户
                await Clients.Caller.SendAsync("ReceiveUpdatedContact", new
                {
                    Contact = simplifiedContact,
                    TotalUnreadCount = totalUnreadCount,
                    UpdateTime = DateTime.UtcNow
                });
            }

            logger.LogInformation("用户 {UserId} 标记聊天 {ChatId} 消息已读", userId, chatUniqueMark);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "标记消息已读失败，用户: {UserId}, 聊天: {ChatId}", userId, chatUniqueMark);
        }
    }
    

}
