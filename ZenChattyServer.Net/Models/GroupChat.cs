namespace ZenChattyServer.Net.Models;

public class GroupChat(User initBy, List<GroupChatMember> members) : Chat(initBy)
{
    public List<GroupChatMember> Members { get; set; } = members;
    public GroupSettings Settings { get; set; } = new();
    public List<Message> GroupAnnounce { get; set; } = new();
}