import { EGender, EUserStatus } from './enums';
import { PrivacySettings } from './other';
export declare class User {
    localId: string;
    email: string;
    displayName: string;
    avatarFileLocator: string;
    backgroundFileLocator: string;
    bio: string;
    customId: string | undefined;
    phoneNumber: string | undefined;
    status: EUserStatus;
    gender: EGender;
    birth: Date | undefined;
    registeredAt: Date;
    privacies: PrivacySettings;
    constructor(email: string, displayName: string, customId: string | undefined, localId?: string, registeredAt?: Date, avatarFileLocator?: string, backgroundFileLocator?: string, bio?: string, phoneNumber?: string | undefined, status?: EUserStatus, gender?: EGender, birth?: Date | undefined, privacies?: PrivacySettings);
}
export declare class UserInfoResponse {
    localId: string;
    message: string;
    email?: string;
    displayName?: string;
    avatarFileLocator?: string;
    backgroundFileLocator?: string;
    bio?: string;
    customId?: string;
    phoneNumber?: string;
    status: EUserStatus;
    gender: EGender;
    birth?: Date;
    registeredAt: Date;
    success: boolean;
}
export declare class UserAuthObject {
    userId: string;
    passwordHash: string;
    passwordSalt: string;
}
//# sourceMappingURL=user.d.ts.map