using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class GroupChatMember(User member)
{
    public User TheGuy { get; set; } = member;
    public EGroupMemberType Type { get; set; } = EGroupMemberType.Member;
    public string? GivenTitle { get; set; }
    public string Nickname { get; set; } = "";
    public bool IsSilent { get; set; } = false;
    public DateTime JoinedAt { get; set; } = DateTime.Now;
    public DateTime? SilentUntil { get; set; }
}