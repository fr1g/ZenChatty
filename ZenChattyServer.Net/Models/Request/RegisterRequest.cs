using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class RegisterRequest
{
    public string UniqueCustomId { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress] 
    public string Email { get; set; } = string.Empty;
    public string Gender { get; set; } = "Unset";
    public DateTime? Birthday { get; set; }
    public string Bio { get; set; } = string.Empty;
}