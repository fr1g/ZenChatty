using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Helpers;

public class RelationshipHelper
{
    public bool IsUserAFriend(User looker, User looking)
    {
        // find if in db the looker -> looking AND looking -> looker EXISTS
        return false;
    }

    public bool IsUserGroupMate(User looker, User looking, GroupChat via)
    {
        return false;
    }
    
    public bool IsUserGroupMember(User looker, GroupChat looking)
    {
        return false;
    }
}