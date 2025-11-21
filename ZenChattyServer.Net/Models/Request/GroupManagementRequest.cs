using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class GroupManagementRequest
{
    [Required]
    public string GroupId { get; set; } = string.Empty;
    
    [Required]
    public string TargetUserId { get; set; } = string.Empty;
    
    public string? Reason { get; set; }
    
    public TimeSpan? SilentDuration { get; set; }
    
    public string? NewTitle { get; set; }
}