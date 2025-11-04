using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class PrivacySettings
{
    public bool IsDiscoverableViaSearch { get; set; } = false;
    public bool IsInvitableToGroup { get; set; } = false;
    public bool IsAddableFromGroup { get; set; } = false;
    public bool IsNewChatKeepSilent { get; set; } = false;

    public EPrivacyVisibilityRange GenderVisibility { get; set; } = EPrivacyVisibilityRange.Everyone;
    
}