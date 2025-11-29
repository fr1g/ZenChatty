using Microsoft.AspNetCore.SignalR;
using ZenChattyServer.Net.Hubs;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Services;

public class ChatHubService(IHubContext<ChatHub> hubContext)
{
    public async Task SendMessageAsUserAsync(string chatUniqueMark, Guid senderId, string content, EMessageType messageType = EMessageType.Normal)
    {
        await hubContext.Clients.Group(chatUniqueMark).SendAsync("SendMessageAsUser",  // used as-in ChatHub Transient method
            chatUniqueMark, senderId, content, messageType);
    }

    public async Task SendMessageAsUserAsync(Message message)
    {
        await hubContext.Clients.Group(message.OfChatId).SendAsync("SendMessageAsUser",  // used as-in ChatHub Transient method
            message.OfChatId, message.SenderId, message.Content, message.Type);
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
            SenderId = message.SenderId
        };

        // 推送完整的Contact和Message对象给所有相关用户（排除发送者）
        await hubContext.Clients.GroupExcept(chatUniqueMark, new[] { senderId.ToString() }).SendAsync("ReceiveUpdatedContactAndMessage", new
        {
            Message = simplifiedMessage,
            TotalUnreadCount = totalUnreadCount,
            UpdateTime = DateTime.UtcNow
        });
    }

    /// <summary>
    /// 推送未读计数更新给所有相关用户
    /// </summary>
    public async Task PushUnreadCountUpdateAsync(string chatUniqueMark, Guid senderId, int unreadCount)
    {
        await hubContext.Clients.GroupExcept(chatUniqueMark, new[] { senderId.ToString() }).SendAsync("ReceiveUnreadCountUpdate", new
        {
            ChatUniqueMark = chatUniqueMark,
            UnreadCount = unreadCount,
            UpdateTime = DateTime.UtcNow
        });
    }
}