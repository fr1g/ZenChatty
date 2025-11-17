using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models;

public class Contact(User opener, Chat chat) // design of userChatObject has been merged here.
{
    public Contact() : this(null!, null!) {}
    [Key]
    public Guid ContactId { get; set; } = Guid.NewGuid();
    
    public Guid HostId { get; set; }
    public User Host { get; set; } = opener;
    
    public string ObjectId { get; set; }
    public Chat Object { get; set; } = chat; // can be a group  or   private
    public ushort LastUnreadCount { get; set; }
    public DateTime LastUsed { get; set; }
    public DateTime AddTime { get; set; } = DateTime.Now;
    public bool IsPinned { get; set; } = false;
    public bool IsBlocked { get; set; } = false;
    public string? DisplayName { get; set; } = null;
    
}