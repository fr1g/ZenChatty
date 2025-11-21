using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class GroupInviteLinkRequest
{
    [Required]
    public string GroupId { get; set; } = string.Empty;
    
    public DateTime? ExpiresAt { get; set; }
    
    public string? TargetUserId { get; set; }
    
    public bool IsPublic { get; set; } = false;
}