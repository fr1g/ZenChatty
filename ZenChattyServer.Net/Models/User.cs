namespace ZenChattyServer.Net.Models;

public class User
{
    public static string LocalId { get; set; } = Guid.NewGuid().ToString();
    public string DisplayName { get; set; } = "anonymous";
    public string CustomId { get; set; } = LocalId;
    public EUserStatus Status { get; set; } = EUserStatus.Unknown;
    public string AvatarLocator { get; set; } = "file:img:0";


}