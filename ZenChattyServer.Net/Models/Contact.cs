using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models;

public class Contact(User opener, Chat chat) // design of userChatObject has been merged here.
{
    public Contact() : this(new User(), new Chat()) {}
    [Key]
    public Guid ContactId { get; set; } = Guid.NewGuid();
    
    public Guid HostId { get; set; }
    public virtual User Host { get; set; } = opener;
    
    public string ObjectId { get; set; } = string.Empty;
    public virtual Chat Object { get; set; } = chat; // can be a group  or   private
    public ushort LastUnreadCount { get; set; }
    public DateTime LastUsed { get; set; }
    public DateTime AddTime { get; set; } = DateTime.Now;
    public bool IsPinned { get; set; } = false;
    public bool IsBlocked { get; set; } = false;
    public string? DisplayName { get; set; } = null;
    public bool HasVitalUnread { get; set; } = false; // 重要未读标记：@提及、群公告、@全体事件
    
}