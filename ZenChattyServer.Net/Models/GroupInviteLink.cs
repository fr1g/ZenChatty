using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models;

public class GroupInviteLink
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string GroupId { get; set; } = string.Empty;
    
    public virtual GroupChat? Group { get; set; }
    
    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;
    
    [Required]
    public string InviteCode { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ExpiresAt { get; set; }
    
    public string? TargetUserId { get; set; }
    
    public bool IsPublic { get; set; } = false;
    
    public bool IsUsed { get; set; } = false;
    
    public DateTime? UsedAt { get; set; }
    
    public string? UsedByUserId { get; set; }
}