using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class Chat(User initBy)
{
    public Chat() : this(null!) { }
    
    [Key]
    public string UniqueMark { get; set; }  = Guid.NewGuid().ToString();
    
    public Guid InitById { get; set; }
    public User InitBy { get; set; } = initBy;
    
    public virtual ICollection<Message> History { get; set; } = new List<Message>();
    public EChatStatus Status { get; set; } = EChatStatus.Normal;
    
    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
}