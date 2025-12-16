using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Hubs;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Events;

namespace ZenChattyServer.Net.Services;

public class ChatHubService(IHubContext<ChatHub> hubContext, IServiceScopeFactory scopeFactory)
{
    /// <summary>
    /// 推送新消息给聊天组（使用 IncomeMessage 事件）
    /// </summary>
    public async Task SendIncomeMessageAsync(string chatUniqueMark, Message message)
    {
        var eventData = new IncomeMessageEvent(chatUniqueMark, message);
        await hubContext.Clients.Group(chatUniqueMark).SendAsync("IncomeMessage", eventData);
    }

    /// <summary>
    /// 推送消息更新给聊天组（使用 PatchMessage 事件）
    /// </summary>
    public async Task SendPatchMessageAsync(string chatUniqueMark, Message message, string updateType = "content")
    {
        var eventData = new PatchMessageEvent(chatUniqueMark, message, updateType);
        await hubContext.Clients.Group(chatUniqueMark).SendAsync("PatchMessage", eventData);
    }

    /// <summary>
    /// 模拟用户发送消息（系统内部调用）
    /// </summary>
    public async Task SendMessageAsUserAsync(string chatUniqueMark, Guid senderId, string content, EMessageType messageType = EMessageType.Normal)
    {
        // 创建一个简化的消息对象用于推送
        var simplifiedMessage = new
        {
            TraceId = Guid.NewGuid().ToString(),
            Content = content,
            Type = messageType,
            SenderId = senderId,
            OfChatId = chatUniqueMark,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ServerCaughtTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await hubContext.Clients.Group(chatUniqueMark).SendAsync("IncomeMessage", new
        {
            EventType = "IncomeMessage",
            ChatUniqueMark = chatUniqueMark,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Message = simplifiedMessage
        });
    }

    /// <summary>
    /// 模拟用户发送消息（传入完整消息对象）
    /// </summary>
    public async Task SendMessageAsUserAsync(Message message)
    {
        await SendIncomeMessageAsync(message.OfChatId, message);
    }

    /// <summary>
    /// 推送完整的Contact和Message对象给所有相关用户（排除发送者）
    /// </summary>
    public async Task PushUpdatedContactAndMessageAsync(string chatUniqueMark, Guid senderId, Message message, int totalUnreadCount)
    {
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
            SenderId = message.SenderId,
            SenderName = message.SenderName,
            SenderAvatarLocator = message.SenderAvatarLocator,
            OfChatId = message.OfChatId
        };

        // 使用 IncomeMessage 事件推送
        await hubContext.Clients.GroupExcept(chatUniqueMark, new[] { senderId.ToString() }).SendAsync("IncomeMessage", new
        {
            EventType = "IncomeMessage",
            ChatUniqueMark = chatUniqueMark,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Message = simplifiedMessage
        });
    }

    /// <summary>
    /// 推送未读计数更新给所有相关用户
    /// </summary>
    public async Task PushUnreadCountUpdateAsync(string chatUniqueMark, Guid senderId, int unreadCount)
    {
        await hubContext.Clients.GroupExcept(chatUniqueMark, new[] { senderId.ToString() }).SendAsync("UpdateRecents", new
        {
            ChatUniqueMark = chatUniqueMark,
            UnreadCount = unreadCount,
            UpdateTime = DateTime.UtcNow
        });
    }

    /// <summary>
    /// 推送 UpdateRecents 事件给聊天的所有参与者（用于更新首页聊天列表）
    /// 这会向参与者的个人通知组发送事件，即使他们没有在聊天界面也能收到
    /// </summary>
    public async Task PushUpdateRecentsToParticipantsAsync(Message message)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<UserRelatedContext>();
            
            var chat = await context.Chats
                .Include(c => (c as GroupChat)!.Members)
                .FirstOrDefaultAsync(c => c.UniqueMark == message.OfChatId);

            if (chat == null)
            {
                Console.WriteLine($"[ChatHubService] 找不到聊天: {message.OfChatId}");
                return;
            }

            // 获取所有参与者ID（排除发送者）
            var participantIds = new List<Guid>();
            
            if (chat is PrivateChat privateChat)
            {
                participantIds.Add(privateChat.InitById);
                participantIds.Add(privateChat.ReceiverId);
            }
            else if (chat is GroupChat groupChat)
            {
                participantIds.AddRange(groupChat.Members.Select(m => m.TheGuyId));
            }
            
            // 移除发送者（他不需要收到自己发送的消息通知）
            participantIds = participantIds.Where(id => id != message.SenderId).Distinct().ToList();

            Console.WriteLine($"[ChatHubService] 向 {participantIds.Count} 个用户推送 UpdateRecents");

            // 创建简化的消息对象
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
                SenderId = message.SenderId,
                SenderName = message.SenderName,
                SenderAvatarLocator = message.SenderAvatarLocator,
                OfChatId = message.OfChatId
            };

            // 向每个参与者的个人组发送 UpdateRecents 事件
            foreach (var participantId in participantIds)
            {
                var userGroupName = $"user-{participantId}";
                await hubContext.Clients.Group(userGroupName).SendAsync("UpdateRecents", new
                {
                    ChatUniqueMark = message.OfChatId,
                    Message = simplifiedMessage,
                    TotalUnreadCount = 1, // TODO: 可以从数据库获取真实的未读数
                    UpdateTime = DateTime.UtcNow.ToString("O")
                });
                Console.WriteLine($"[ChatHubService] 已向用户组 {userGroupName} 推送 UpdateRecents");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ChatHubService] 推送 UpdateRecents 失败: {ex.Message}");
        }
    }
}
