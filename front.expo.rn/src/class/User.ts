import { EUserStatus, EGender } from "./enums/EnumUserRelated";
import PrivacySettings from "./PrivacySettings";

export default class User {
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
        localId: string,
        email: string,
        displayName: string,
        customId: string | undefined,
        registeredAt: Date = new Date(),
        avatarFileLocator: string = 'img:xdefaultavtr.jpg',
        backgroundFileLocator: string = 'img:xdefaultback.jpg',
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

/** File Locator Hints
 * Look Up Line:
 * localCache > queryOnline
 * if NOT FOUND at local place, get from online places.
 */