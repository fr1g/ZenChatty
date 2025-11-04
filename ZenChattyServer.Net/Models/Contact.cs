namespace ZenChattyServer.Net.Models;

public class Contact
{
    public User Host { get; set; }
    public Chat Object { get; set; } // can be a group  or   private
    public ushort LastUnreadCount { get; set; }
    public DateTime LastUsed { get; set; }
    public DateTime AddTime { get; set; } = DateTime.Now;
    public bool IsPinned { get; set; } = false;
    public bool IsBlocked { get; set; } = false;
    public string? DisplayName { get; set; } = null;
    
}