import { Chat, GroupChat, PrivateChat } from './chat';
import { EPrivacyVisibilityRange } from './enums';
import { User } from './user';

export class Contact {

    contactId: string;
    host: User;
    object: Chat;
    lastUnreadCount: number;
    lastUsed: Date;
    addTime: Date;
    isPinned: boolean;
    isBlocked: boolean;
    displayName: string | null;
    avatarFileLocator: string | null;

    constructor(
        id: string,
        host: User,
        object: Chat,
        lastUnreadCount: number = 0,
        lastUsed: Date = new Date(),
        addTime: Date = new Date(),
        isPinned: boolean = false,
        isBlocked: boolean = false,
        displayName: string | null = null,
        avatarFileLocator: string | null = null
    ) {
        this.contactId = id;
        this.host = host;
        this.object = object;
        this.lastUnreadCount = lastUnreadCount;
        this.lastUsed = lastUsed;
        this.addTime = addTime;
        this.isPinned = isPinned;
        this.isBlocked = isBlocked;

        let isGroup = object instanceof GroupChat;

        if (displayName != null) {
            this.displayName = displayName;
        }
        else if (isGroup) {
            this.displayName = (object as GroupChat).settings.displayName;
        } else {
            if (host.localId === (object as PrivateChat).initBy.localId) {
                this.displayName = (object as PrivateChat).receiver.displayName;
            } else {
                this.displayName = (object as PrivateChat).initBy.displayName;
            }
        }
        if (avatarFileLocator != null) {
            this.avatarFileLocator = avatarFileLocator;
        }
        else if (isGroup) {
            this.avatarFileLocator = (object as GroupChat).settings.avatarFileLocator;
        }
        else {
            if (host.localId === (object as PrivateChat).initBy.localId) {
                this.avatarFileLocator = (object as PrivateChat).receiver.avatarFileLocator;
            } else {
                this.avatarFileLocator = (object as PrivateChat).initBy.avatarFileLocator;
            }
        }
    }

}

export class PrivacySettings {

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

export class PrivacySettingsResponse {

    public privacySettings: PrivacySettings = new PrivacySettings();
    public success: boolean = false;
    public message: string = '';

}

export class DeviceSession {

    public deviceId: string = '';
    public userId: string = '';
    public deviceName: string = '';
    public deviceType: string = '';

    public lastActiveAt: Date = new Date();
    public createdAt: Date = new Date();

}

export class UserFile {

    public fileId: string = '';
    public userId: string = '';
    public fileName: string = '';
    public fileType: string = '';
    public fileSize: number = 0;
    public filePath: string = '';

    public uploadedAt: Date = new Date();
}

export class GroupInviteLink {

    public inviteLinkId: string = '';
    public groupChatId: string = '';
    public inviteCode: string = '';
    public createdById: string = '';
    public maxUses: number = 0;
    public usedCount: number = 0;
    public expiresAt?: Date;

    public createdAt: Date = new Date();

}