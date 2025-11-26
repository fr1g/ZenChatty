using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models;

public class GroupSettings()
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [MaxLength(80)]
    public string DisplayName { get; set; } = "Group";
    
    [MaxLength(80)]
    public string AvatarFileLocator { get; set; } = "";
    public bool IsAllSilent { get; set; } = false;
    public bool IsInviteOnly { get; set; } = false; // invite link, QR code with expiration // todo: deprecated: no need to allow group search for now (time cost)
    public bool IsPrivateChatAllowed { get; set; } = false;
}