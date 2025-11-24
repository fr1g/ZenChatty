using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Helpers;

public class ChatAgent
{
    public static async Task Say(UserRelatedContext context, Message message, ChatHubService agency)
    {
        context.Messages.Add(message);
        await context.SaveChangesAsync();
        await agency.SendMessageAsUserAsync(message);
    }
}