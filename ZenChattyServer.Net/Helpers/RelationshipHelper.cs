using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Helpers;

public class RelationshipHelper
{
    public bool IsUserAFriend(User looker, User looking)
    {
        return false;
    }

    public bool IsUserGroupMate(User looker, User looking, GroupChat via)
    {
        return false;
    }
}