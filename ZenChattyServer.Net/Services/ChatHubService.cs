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
}