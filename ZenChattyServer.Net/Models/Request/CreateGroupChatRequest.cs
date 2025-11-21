using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class CreateGroupChatRequest
{
    [Required]
    public string GroupName { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public string? AvatarUrl { get; set; }
    
    public bool AllowMemberInvite { get; set; } = true;
    
    public bool RequireApproval { get; set; } = false;
}