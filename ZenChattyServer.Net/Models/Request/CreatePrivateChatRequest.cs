using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

public class CreatePrivateChatRequest
{
    [Required]
    public string ReceiverCustomId { get; set; } = string.Empty;
    
    public bool IsInformal { get; set; } = false;
    
    public string? DisplayName { get; set; }
}