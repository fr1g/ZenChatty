using System.ComponentModel.DataAnnotations;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Request;

public class UserInfoQueryRequest
{
    [Required]
    public string Email { get; set; } = string.Empty;
    
    public string? CustomId { get; set; }
}