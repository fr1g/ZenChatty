namespace ZenChattyServer.Net.Models;

public class GroupSettings
{
    public bool IsAllSilent { get; set; } = false;
    public bool IsInviteOnly { get; set; } = false; // invite link, QR code with expiration 
    public bool IsPrivateChatAllowed { get; set; } = false;
}