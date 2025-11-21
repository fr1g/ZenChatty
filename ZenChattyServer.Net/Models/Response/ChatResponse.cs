namespace ZenChattyServer.Net.Models.Response;

public class ChatResponse
{
    public string ChatId { get; set; } = string.Empty;
    public string ChatType { get; set; } = string.Empty; // "Private" or "Group"
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public ushort UnreadCount { get; set; }
    public DateTime LastActivity { get; set; }
    public bool IsBlocked { get; set; }
    public bool IsPinned { get; set; }
    public string? LastMessagePreview { get; set; }
}