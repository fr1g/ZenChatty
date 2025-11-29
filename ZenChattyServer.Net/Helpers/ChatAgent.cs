using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
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

    public static async Task SayWithFullUpdate(UserRelatedContext context, Message message, ChatHubService agency, ContactService contactService)
    {
        // 保存消息到数据库
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        // 更新未读计数（排除发送者自己）
        var totalUnreadCount = await UpdateUnreadCountForChatAsync(context, message.OfChatId, message.SenderId, message);

        // 推送完整的Contact和Message对象给所有相关用户（排除发送者）
        await agency.PushUpdatedContactAndMessageAsync(message.OfChatId, message.SenderId, message, totalUnreadCount);
    }

    /// <summary>
    /// 更新聊天室的未读计数
    /// </summary>
    private static async Task<int> UpdateUnreadCountForChatAsync(UserRelatedContext context, string chatUniqueMark, Guid senderId, Message message)
    {
        try
        {
            // 获取聊天室的所有联系人（排除发送者）
            var contacts = await context.Contacts
                .Include(c => c.Host)
                .Where(c => c.ObjectId == chatUniqueMark && c.HostId != senderId)
                .ToListAsync();

            // 判断是否为重要事件
            var isVitalEvent = IsVitalEvent(message);

            foreach (var contact in contacts)
            {
                // 更新未读计数
                contact.LastUnreadCount++;
                
                // 如果是重要事件，更新vitalUnread状态
                if (isVitalEvent)
                {
                    contact.HasVitalUnread = true;
                }
            }

            await context.SaveChangesAsync();

            // 返回总未读计数（用于推送）
            return contacts.Sum(c => c.LastUnreadCount);
        }
        catch (Exception ex)
        {
            // 记录错误但不影响主流程
            await Console.Error.WriteLineAsync($"更新未读计数失败: {ex.Message}");
            return 0;
        }
    }

    /// <summary>
    /// 判断是否为重要事件（需要更新vitalUnread状态）
    /// </summary>
    private static bool IsVitalEvent(Message message)
    {
        // 重要事件类型：公告、系统通知、@全体成员等
        return message.Type == EMessageType.Announcement || 
               message.Type == EMessageType.Event ||
               message.IsMentioningAll ||
               message.IsAnnouncement;
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