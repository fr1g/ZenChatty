namespace ZenChattyServer.Net.Models;

public class GroupChat(User initBy, List<GroupChatMember>? members = null) : Chat(initBy)
{
    public GroupChat() : this(null!) { } // solved back to base class
    
    public virtual ICollection<GroupChatMember> Members { get; set; } = members ?? [];
    public virtual GroupSettings Settings { get; set; } = new();
    
    // 公告消息集合（软拷贝，存储被标记为公告的消息）
    public virtual ICollection<Message> AnnouncementMessages { get; set; } = new List<Message>();
    /* todo
     * 需要删除这个属性并改换为从Messages查询被标记为此群聊的公告的消息
     * 获取群公告（不分页）则由Message类型中结合所属Chat的UniqueMark和其本身的Type进行查询
     */
}