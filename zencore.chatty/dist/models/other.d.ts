import { Chat } from './chat';
import { EPrivacyVisibilityRange } from './enums';
import { User } from './user';
export declare class Contact {
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
    constructor(id: string, host: User, object: Chat, lastUnreadCount?: number, lastUsed?: Date, addTime?: Date, isPinned?: boolean, isBlocked?: boolean, displayName?: string | null, avatarFileLocator?: string | null);
}
export declare class PrivacySettings {
    isDiscoverableViaSearch: boolean;
    isInvitableToGroup: boolean;
    isAddableFromGroup: boolean;
    isNewChatKeepSilent: boolean;
    contactVisibility: EPrivacyVisibilityRange;
    bioVisibility: EPrivacyVisibilityRange;
    genderVisibility: EPrivacyVisibilityRange;
    constructor(isDiscoverableViaSearch?: boolean, isInvitableToGroup?: boolean, isAddableFromGroup?: boolean, isNewChatKeepSilent?: boolean, contactVisibility?: EPrivacyVisibilityRange, bioVisibility?: EPrivacyVisibilityRange, genderVisibility?: EPrivacyVisibilityRange);
}
export declare class PrivacySettingsResponse {
    privacySettings: PrivacySettings;
    success: boolean;
    message: string;
}
export declare class DeviceSession {
    deviceId: string;
    userId: string;
    deviceName: string;
    deviceType: string;
    lastActiveAt: Date;
    createdAt: Date;
}
export declare class UserFile {
    fileId: string;
    userId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    uploadedAt: Date;
}
export declare class GroupInviteLink {
    inviteLinkId: string;
    groupChatId: string;
    inviteCode: string;
    createdById: string;
    maxUses: number;
    usedCount: number;
    expiresAt?: Date;
    createdAt: Date;
}
//# sourceMappingURL=other.d.ts.map