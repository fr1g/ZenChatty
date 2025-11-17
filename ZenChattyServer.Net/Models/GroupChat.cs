namespace ZenChattyServer.Net.Models;

public class GroupChat(User? initBy = null, List<GroupChatMember>? members = null) : Chat(initBy)
{
    public GroupChat() : this(null!) { }
    
    public IReadOnlyCollection<GroupChatMember> Members { get; set; } = members ?? new List<GroupChatMember>();
    public GroupSettings Settings { get; set; } = new();
    public virtual ICollection<Message> GroupAnnounce { get; set; } = new List<Message>();
}