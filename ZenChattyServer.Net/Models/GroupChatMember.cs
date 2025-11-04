using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class GroupChatMember
{
    public User TheGuy { get; set; }
    public EGroupMemberType type { get; set; } = EGroupMemberType.Member;
    public string GivenTitle { get; set; } = "";
    
    // public GroupChat TheGroup { get; set; }
}