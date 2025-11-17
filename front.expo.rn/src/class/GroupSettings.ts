export default class GroupSettings
{
    displayName: string;
    isAllSilent: boolean;
    isInviteOnly: boolean; // invite link, QR code with expiration 
    isPrivateChatAllowed: boolean;
    
    constructor(
        displayName: string = "Group",
        isAllSilent: boolean = false,
        isInviteOnly: boolean = false,
        isPrivateChatAllowed: boolean = false
    ) {
        this.displayName = displayName;
        this.isAllSilent = isAllSilent;
        this.isInviteOnly = isInviteOnly
        this.isPrivateChatAllowed = isPrivateChatAllowed;
    }
}
