using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Helpers;

public class RelationshipHelper
{

    public static bool IsUserAFriend(UserRelatedContext context, User looker, User looking)
    {
        // 查找looker和looking之间的非临时私聊
        var privateChat = context.PrivateChats
            .Include(pc => pc.InitBy)
            .Include(pc => pc.Receiver)
            .FirstOrDefault(pc => 
                ((pc.InitBy.LocalId == looker.LocalId && pc.Receiver.LocalId == looking.LocalId) ||
                 (pc.InitBy.LocalId == looking.LocalId && pc.Receiver.LocalId == looker.LocalId)) &&
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
            .Include(pc => pc.Receiver)
            .FirstOrDefault(pc => 
                (pc.InitBy.LocalId == looker.LocalId && pc.Receiver.LocalId == looking.LocalId) ||
                (pc.InitBy.LocalId == looking.LocalId && pc.Receiver.LocalId == looker.LocalId));
                
        return privateChat != null;
    }

    /// <summary>
    /// 根据用户的隐私设置，判断是否可以查看个人信息
    /// 如果是informal私聊，根据隐私设置决定是否可以查看个人信息
    /// </summary>
    public static bool CanViewPersonalInfo(UserRelatedContext context, User looker, User looking, PrivacySettings privacySettings)
    {
        // 如果是好友关系，可以查看个人信息
        if (IsUserAFriend(context, looker, looking))
            return true;

        // 检查是否存在informal私聊
        var privateChat = context.PrivateChats
            .Include(pc => pc.InitBy)
            .Include(pc => pc.Receiver)
            .FirstOrDefault(pc => 
                ((pc.InitBy.LocalId == looker.LocalId && pc.Receiver.LocalId == looking.LocalId) ||
                 (pc.InitBy.LocalId == looking.LocalId && pc.Receiver.LocalId == looker.LocalId)) &&
                pc.IsInformal);

        // 如果存在informal私聊，根据隐私设置决定是否可以查看个人信息
        if (privateChat != null)
        {
            // 如果隐私设置允许通过群聊查看个人信息，则可以查看
            return privacySettings.AllowViewInfoFromGroupChat;
        }

        // 默认情况下，非好友关系不能查看个人信息
        return false;
    }

    /// <summary>
    /// 判断两个用户是否在同一个群组中互为群友
    /// </summary>
    public static bool IsUserGroupMate(User looker, User looking, GroupChat via)
    {
        // 首先确认looker和looking都在同一个群组中
        bool lookerInGroup = IsUserGroupMember(looker, via);
        bool lookingInGroup = IsUserGroupMember(looking, via);
        
        return lookerInGroup && lookingInGroup;
    }
    
    /// <summary>
    /// 判断用户是否为群组成员
    /// 只需要确认被查询User是否在被查询群聊的GroupMember List中
    /// </summary>
    public static bool IsUserGroupMember(User looking, GroupChat via)
    {
        if (via?.Members == null) return false;
        
        return via.Members.Any(member => member.TheGuy.LocalId == looking.LocalId);
    }
}