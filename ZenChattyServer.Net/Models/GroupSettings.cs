using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models;

public class GroupSettings()
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string DisplayName { get; set; } = "Group";
    public string AvatarFileLocator { get; set; } = "";
    public bool IsAllSilent { get; set; } = false;
    public bool IsInviteOnly { get; set; } = false; // invite link, QR code with expiration 
    public bool IsPrivateChatAllowed { get; set; } = false;
}