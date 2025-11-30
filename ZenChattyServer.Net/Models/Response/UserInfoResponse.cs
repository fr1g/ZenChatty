using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Response;
public class UserInfoResponse
    {
        public Guid LocalId { get; set; }
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarFileLocator { get; set; }
        public string? BackgroundFileLocator { get; set; }
        public string? Bio { get; set; }
        public string? CustomId { get; set; }
        public string? PhoneNumber { get; set; }
        public EUserStatus Status { get; set; }
        public EGender Gender { get; set; }
        public DateTime? Birth { get; set; }
        public DateTime RegisteredAt { get; set; }
        public bool success { get; set; }
        public string message { get; set; } = string.Empty;
    }