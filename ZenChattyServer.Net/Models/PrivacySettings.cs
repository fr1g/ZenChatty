using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

[Table("PrivacySettings")]
public class PrivacySettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    
    public virtual User User { get; set; } = null!;

    public bool IsDiscoverableViaSearch { get; set; } = false;
    public bool IsInvitableToGroup { get; set; } = false;
    public bool IsAddableFromGroup { get; set; } = false;
    public bool IsNewChatKeepSilent { get; set; } = false;
    public bool AllowViewInfoFromGroupChat { get; set; } = false;

    public EPrivacyVisibilityRange ContactVisibility { get; set; } = EPrivacyVisibilityRange.None;
    public EPrivacyVisibilityRange BioVisibility { get; set; } = EPrivacyVisibilityRange.FriendsAndGroups;
    public EPrivacyVisibilityRange GenderVisibility { get; set; } = EPrivacyVisibilityRange.Everyone;
    
}