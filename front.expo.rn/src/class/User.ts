import { EUserStatus, EGender } from "./enums/EnumUserRelated";

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
    birth: Date;
    registeredAt: Date;

    constructor(
        localId: string,
        email: string,
        displayName: string,
        avatarFileLocator: string,
        backgroundFileLocator: string,
        bio: string,
        customId: string | undefined,
        phoneNumber: string | undefined,
        status: EUserStatus,
        gender: EGender,
        birth: Date,
        registeredAt: Date
    ) {
        this.localId = localId
        this.email = email
        this.displayName = displayName
        this.avatarFileLocator = avatarFileLocator
        this.backgroundFileLocator = backgroundFileLocator
        this.bio = bio
        this.customId = customId
        this.phoneNumber = phoneNumber
        this.status = status
        this.gender = gender
        this.birth = birth
        this.registeredAt = registeredAt
    }
}

/** File Locator Hints
 * Look Up Line:
 * localCache > queryOnline
 * if NOT FOUND at local place, get from online places.
 */