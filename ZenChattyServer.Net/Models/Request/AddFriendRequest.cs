using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class AddFriendRequest
{
    [Required]
    public string TargetUserId { get; set; } = string.Empty; // must be GUID
    
    public string? Message { get; set; }
    
    public bool IsInformal { get; set; } = false;
}