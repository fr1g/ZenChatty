export default class GroupSettings
{
    displayName: string;
    avatarFileLocator: string | null;
    isAllSilent: boolean;
    isInviteOnly: boolean; // invite link, QR code with expiration 
    isPrivateChatAllowed: boolean;
    
    constructor(
        displayName: string = "Group",
        avatarFileLocator: string | null = null,
        isAllSilent: boolean = false,
        isInviteOnly: boolean = false,
        isPrivateChatAllowed: boolean = false
    ) {
        this.displayName = displayName;
        this.avatarFileLocator = avatarFileLocator;
         
        this.isAllSilent = isAllSilent;
        this.isInviteOnly = isInviteOnly
        this.isPrivateChatAllowed = isPrivateChatAllowed;
    }
}
