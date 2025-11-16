export class LoginCredential {
    loginPhrase: string;
    rawPassword: string;
    otherProperties: string | undefined;
    loginDeviceType: "mobile" | "desktop" | "maybeTablet";

    constructor(
        loginPhrase: string,
        rawPassword: string,
        loginDeviceType: "mobile" | "desktop" | "maybeTablet",
        otherProperties: string | undefined = undefined
    ) {
        this.loginPhrase = loginPhrase
        this.rawPassword = rawPassword
        this.otherProperties = otherProperties
        this.loginDeviceType = loginDeviceType
    }
    // always remember password.
}

export class RegisterCredential {
    customUid: string;
    passWord: string;
    newAvatarBase64: string | undefined;
    email: string;
    privacySettingsAllowPublicSearch: boolean;

    constructor(
        customUid: string,
        passWord: string,
        email: string,
        newAvatarBase64: string | undefined,
        privacySettingsAllowPublicSearch: boolean = false
    ) {
        this.customUid = customUid
        this.passWord = passWord
        this.newAvatarBase64 = newAvatarBase64
        this.email = email
        this.privacySettingsAllowPublicSearch = privacySettingsAllowPublicSearch
    }

    setAvatarAsBase64() {

    }

}