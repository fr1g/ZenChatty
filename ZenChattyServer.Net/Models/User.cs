using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;
public class User
{
    public static string LocalId { get; set; } = Guid.NewGuid().ToString();
    public string DisplayName { get; set; } = "anonymous";
    public string CustomId { get; set; } = LocalId;
    public EUserStatus Status { get; set; } = EUserStatus.Unknown; // just registered: new; new object: unknown
    public string AvatarBase64 { get; set; } = "";
    public string BackgroundBase64 { get; set; } = "";
    public string Bio { get; set; } = "This guy is pleased with default bio.";
    public EGender Gender { get; set; } = EGender.Unset;
    public DateTime? Birth { get; set; } = null;
    public PrivacySettings Privacies { get; set; } = new();


}