import { EGender, EUserStatus } from './enums';
import { PrivacySettings } from './other';

export class User {

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

    constructor(
        email: string,
        displayName: string,
        customId: string | undefined,
        localId: string = "ungiven",

        registeredAt: Date = new Date(),
        avatarFileLocator: string = '',
        backgroundFileLocator: string = '',
        bio: string = "unset bio.",
        phoneNumber: string | undefined = "+unsetnumber",
        status: EUserStatus = EUserStatus.Online,
        gender: EGender = EGender.Unset,
        birth: Date | undefined = undefined,
        privacies: PrivacySettings = new PrivacySettings(),
    ) {
        this.localId = localId;
        this.email = email;
        this.displayName = displayName;
        this.avatarFileLocator = avatarFileLocator;
        this.backgroundFileLocator = backgroundFileLocator;
        this.bio = bio;
        this.customId = customId;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.gender = gender;
        this.birth = birth;
        this.registeredAt = registeredAt;
        this.privacies = privacies;
    }
}

export class UserInfoResponse {

    public localId: string = '';
    public email?: string;
    public displayName?: string;
    public avatarFileLocator?: string;
    public backgroundFileLocator?: string;
    public bio?: string;
    public customId?: string;
    public phoneNumber?: string;
    public status: EUserStatus = EUserStatus.Unknown;
    public gender: EGender = EGender.Unset;
    public birth?: Date;
    public registeredAt: Date = new Date();
    public success: boolean = false;
    public message?: string;

}

export class UserAuthObject {

    public userId: string = '';
    public passwordHash: string = '';
    public passwordSalt: string = '';

}

