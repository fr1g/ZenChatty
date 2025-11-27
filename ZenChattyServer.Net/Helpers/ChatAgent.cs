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

    public static async Task<(bool success, PrivateChat? chat, string message)> CreatePrivateChatFromGroupAsync
    (
        string initiatorUserId,
        string targetUserId,
        string groupChatId,
        UserRelatedContext context
    )
    {
        // 验证群聊设置是否允许创建私聊
        var groupChat = await context.GroupChats
            .Include(gc => gc.Settings)
            .FirstOrDefaultAsync(gc => gc.UniqueMark == groupChatId);
        
        var initiator = await context.Users.FindAsync(Guid.Parse(initiatorUserId));
        var target = await context.Users.FindAsync(Guid.Parse(targetUserId));

        return await CreatePrivateChatFromGroupAsync(initiator, target, groupChat, context);
    }

    public static async Task<(bool success, PrivateChat? chat, string message)> CreatePrivateChatFromGroupAsync
    (
        User? initiator, 
        User? target, 
        GroupChat? groupChat,
        UserRelatedContext context
    )
    {
        try
        {
            if (groupChat?.Settings?.IsPrivateChatAllowed != true)
                return (false, null, "not allowed to do so in this group");
            if (initiator == null || target == null)
                return (false, null, "no such user");
 
            var existingContact = await context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.HostId.ToString() == initiator.LocalId.ToString() && 
                    c.Object is PrivateChat && 
                    ((PrivateChat)c.Object).InitById.ToString() == target.LocalId.ToString() || 
                    ((PrivateChat)c.Object).ReceiverId.ToString() == target.LocalId.ToString());

            if (existingContact != null)
                return (true, (PrivateChat)existingContact.Object, "already here");

            var privateChat = new PrivateChat(initiator, target)
            {
                IsInformal = true
            };

            context.PrivateChats.Add(privateChat);
            
            var contact1 = new Contact(initiator, privateChat)
            {
                DisplayName = target.DisplayName ?? target.CustomId
            };

            var contact2 = new Contact(target, privateChat)
            {
                DisplayName = initiator.DisplayName ?? initiator.CustomId
            };

            context.Contacts.AddRange(contact1, contact2);
            await context.SaveChangesAsync();
            return (true, privateChat, "私聊创建成功");
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"通过群聊创建私聊失败: {ex.Message}");
            return (false, null, "创建私聊失败");
        }
    }
}