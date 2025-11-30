using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

[Table("PrivacySettings")]
public class PrivacySettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    
    [JsonIgnore]
    public virtual User User { get; set; } = null!;

    public bool IsDiscoverableViaSearch { get; set; } = true; // temporary set this as default
    public bool IsInvitableToGroup { get; set; } = false;
    public bool IsAddableFromGroup { get; set; } = false;
    public bool IsNewChatKeepSilent { get; set; } = false;
    public bool AllowViewInfoFromGroupChat { get; set; } = false;

    public EPrivacyVisibilityRange ContactVisibility { get; set; } = EPrivacyVisibilityRange.None;
    public EPrivacyVisibilityRange BioVisibility { get; set; } = EPrivacyVisibilityRange.FriendsAndGroups;
    public EPrivacyVisibilityRange GenderVisibility { get; set; } = EPrivacyVisibilityRange.Everyone;
    public EPrivacyVisibilityRange BirthdayVisibility { get; set; } = EPrivacyVisibilityRange.Everyone;

    public void Migrate(PrivacySettings settings)
    {
        this.IsDiscoverableViaSearch = settings.IsDiscoverableViaSearch;
        this.IsInvitableToGroup = settings.IsInvitableToGroup;
        this.IsAddableFromGroup = settings.IsAddableFromGroup;
        this.IsNewChatKeepSilent = settings.IsNewChatKeepSilent;
        this.AllowViewInfoFromGroupChat = settings.AllowViewInfoFromGroupChat;
        this.ContactVisibility = settings.ContactVisibility;
        this.BioVisibility = settings.BioVisibility;
        this.GenderVisibility = settings.GenderVisibility;
        this.BirthdayVisibility = settings.BirthdayVisibility;
    }
    
}