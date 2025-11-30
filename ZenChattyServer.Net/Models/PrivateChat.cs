using System.ComponentModel.DataAnnotations.Schema;

namespace ZenChattyServer.Net.Models;

public class PrivateChat(User initBy, User receiver) : Chat(initBy)
{
    public PrivateChat() : this(null!, null!)
    {
        this.ReceiverId = Guid.Empty;
    }
    
    public bool IsInformal { get; set; } = true; // 

    public Guid ReceiverId { get; set; } = receiver?.LocalId ?? Guid.Empty;
    public string ReceiverName { get; set; } = receiver?.DisplayName ?? string.Empty;
    public string ReceiverAvatarLocator { get; set; } = receiver?.AvatarFileLocator ?? string.Empty;
    
}