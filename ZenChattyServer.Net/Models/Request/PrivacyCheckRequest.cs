using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class PrivacyCheckRequest
{
    [Required]
    public string TargetUserId { get; set; } = string.Empty;
    
    [Required]
    public bool IsGroupInvite { get; set; } = false;
}