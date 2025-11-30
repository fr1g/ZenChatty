using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Helpers;

public class RelationshipHelper
{
    public static async Task<bool> CheckBlockStatusAsync(string userId1, string userId2, UserRelatedContext context)
    {
        try
        {
            // 检查userId1是否拉黑了userId2
            var contact1 = await context.Contacts
                .Include(c => c.Host)
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.Host.LocalId.ToString() == userId1 && 
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId2 || ((PrivateChat)c.Object).ReceiverId.ToString() == userId2) &&
                    c.IsBlocked);

            // 检查userId2是否拉黑了userId1
            var contact2 = await context.Contacts
                .Include(c => c.Host)
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.Host.LocalId.ToString() == userId2 && 
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId1 || ((PrivateChat)c.Object).ReceiverId.ToString() == userId1) &&
                    c.IsBlocked);

            return contact1 != null || contact2 != null;
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"检查is blocked失败: {ex.Message}");
            return false;
        }
    }
    public static async Task<(bool allowed, string message)> CheckPrivacySettingsForRequestAsync(
        string targetUserId, string requesterUserId, UserRelatedContext context, bool isGroupInvite = false)
    {
        try
        {
            var targetUser = await context.Users
                .Include(u => u.Privacies)
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == targetUserId);

            var requester = await context.Users
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == requesterUserId);
                
            if (requester == null || targetUser == null)
                return (false, "Requester or Target user does not exist");

            // 检查是否被拉黑
            var isBlocked = await CheckBlockStatusAsync(targetUserId, requesterUserId, context);
            if (isBlocked)
            {
                Console.WriteLine("blocked");
                return (false, "You have been blocked by the other party, cannot send request");
            }

            // 检查隐私设置
            var privacy = targetUser.Privacies;
            
            if (isGroupInvite)
            {
                // 群聊邀请检查
                if (!privacy.IsInvitableToGroup)
                    return (false, "The other party does not allow being invited to group chats");
            }
            else
            {
                // 好友请求检查
                if (!privacy.IsAddableFromGroup)
                {
                    Console.WriteLine("not allowed");
                    return (false, "The other party does not allow adding friends through group chats");
                }
            }

            return (true, "Request allowed");
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"检查隐私设置失败: {ex.Message}");
            return (false, "检查隐私设置失败");
        }
    }

    public static bool IsUserAFriend(UserRelatedContext context, User looker, User looking)
    {
        // 查找looker和looking之间的非临时私聊
        var privateChat = context.PrivateChats
            .Include(pc => pc.InitBy)
            .FirstOrDefault(pc => 
                ((pc.InitBy.LocalId == looker.LocalId && pc.ReceiverId == looking.LocalId) ||
                 (pc.InitBy.LocalId == looking.LocalId && pc.ReceiverId == looker.LocalId)) &&
                !pc.IsInformal); // must be existing
                
        return privateChat != null;
    }

    /// <summary>
    /// 判断两个用户之间是否存在私聊关系（包括informal私聊）
    /// </summary>
    public static bool HasPrivateChat(UserRelatedContext context, User looker, User looking)
    {
        // 查找looker和looking之间的任何私聊（包括informal）
        var privateChat = context.PrivateChats
            .Include(pc => pc.InitBy)
            .FirstOrDefault(pc => 
                (pc.InitBy.LocalId == looker.LocalId && pc.ReceiverId == looking.LocalId) ||
                (pc.InitBy.LocalId == looking.LocalId && pc.ReceiverId == looker.LocalId));
                
        return privateChat != null;
    }
    
    public static bool IsUserGroupMate(User looker, User looking, GroupChat via)
    {
        return IsUserGroupMember(looker, via) && IsUserGroupMember(looking, via);
    }
    
    public static bool IsUserGroupMember(User looking, GroupChat via)
    {
        return via?.Members != null && via.Members.Any(member => member.TheGuy.LocalId == looking.LocalId);
    }
}