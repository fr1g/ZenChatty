namespace ZenChattyServer.Net.Models;

public class GroupChat(User initBy, List<GroupChatMember>? members = null) : Chat(initBy)
{
    public GroupChat() : this(null!) { } // solved back to base class
    
    public virtual ICollection<GroupChatMember> Members { get; set; } = members ?? [];
    public virtual GroupSettings Settings { get; set; } = new();
    
    // 公告消息集合（软拷贝，存储被标记为公告的消息）
    public virtual ICollection<Message> AnnouncementMessages { get; set; } = new List<Message>();
}