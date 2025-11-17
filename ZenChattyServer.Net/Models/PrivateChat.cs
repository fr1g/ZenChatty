using System.ComponentModel.DataAnnotations.Schema;

namespace ZenChattyServer.Net.Models;

public class PrivateChat(User initBy, User receiver) : Chat(initBy)
{
    public PrivateChat() : this(null!, null!) { }
    
    public bool IsInformal { get; set; } = true; // not added into contact
    
    public Guid ReceiverId { get; set; } = receiver?.LocalId ?? Guid.Empty;
    public User Receiver { get; set; } = receiver!;
}