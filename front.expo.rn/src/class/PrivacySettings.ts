enum EPrivacyVisibilityRange {
    None = "None",
    FriendsAndGroups = "FriendsAndGroups",
    Everyone = "Everyone"
}

export default class PrivacySettings {

    isDiscoverableViaSearch: boolean;
    isInvitableToGroup: boolean;
    isAddableFromGroup: boolean;
    isNewChatKeepSilent: boolean;
    contactVisibility: EPrivacyVisibilityRange;
    bioVisibility: EPrivacyVisibilityRange;
    genderVisibility: EPrivacyVisibilityRange;

    constructor(
        isDiscoverableViaSearch: boolean = false,
        isInvitableToGroup: boolean = false,
        isAddableFromGroup: boolean = false,
        isNewChatKeepSilent: boolean = false,
        contactVisibility: EPrivacyVisibilityRange = EPrivacyVisibilityRange.None,
        bioVisibility: EPrivacyVisibilityRange = EPrivacyVisibilityRange.FriendsAndGroups,
        genderVisibility: EPrivacyVisibilityRange = EPrivacyVisibilityRange.Everyone
    ) {
        this.isDiscoverableViaSearch = isDiscoverableViaSearch;
        this.isInvitableToGroup = isInvitableToGroup;
        this.isAddableFromGroup = isAddableFromGroup;
        this.isNewChatKeepSilent = isNewChatKeepSilent;
        this.contactVisibility = contactVisibility;
        this.bioVisibility = bioVisibility;
        this.genderVisibility = genderVisibility;
    }

}