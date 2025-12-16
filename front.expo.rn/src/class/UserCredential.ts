import { Credential, User } from "zen-core-chatty-ts";

export default class UserCredential {
    userGuid: string;
    usingDeviceId: string;
    refreshToken: string;
    accessToken: string;
    refreshTokenExpiresAtTimestamp: number;
    accessTokenExpiresAtTimestamp: number;
    userInfo?: User;

    constructor(credential: Credential, userInfo?: User) {
        this.userGuid = credential.UserGuid;
        this.usingDeviceId = credential.UsingDeviceId;
        this.refreshToken = credential.RefreshToken;
        this.accessToken = credential.AccessToken;
        this.refreshTokenExpiresAtTimestamp = credential.RefreshTokenExpiresAtTimestamp;
        this.accessTokenExpiresAtTimestamp = credential.AccessTokenExpiresAtTimestamp;
        this.userInfo = userInfo;
    }

    // Check if access token is expiring soon
    isAccessTokenExpiringSoon(): boolean {
        const now = Date.now();
        const threshold = 5 * 60 * 1000; // 5 minute threshold
        return this.accessTokenExpiresAtTimestamp - now <= threshold;
    }

    // Check if refresh token is expiring soon
    isRefreshTokenExpiringSoon(): boolean {
        const now = Date.now();
        const threshold = 24 * 60 * 60 * 1000; // 24 hour threshold
        return this.refreshTokenExpiresAtTimestamp - now <= threshold;
    }

    // Convert to SDK Credential type
    toCredential(): Credential {
        return {
            UserGuid: this.userGuid,
            UsingDeviceId: this.usingDeviceId,
            RefreshToken: this.refreshToken,
            AccessToken: this.accessToken,
            RefreshTokenExpiresAtTimestamp: this.refreshTokenExpiresAtTimestamp,
            AccessTokenExpiresAtTimestamp: this.accessTokenExpiresAtTimestamp,
        };
    }

    // Create UserCredential instance from SDK Credential
    static fromCredential(credential: Credential, userInfo?: User): UserCredential {
        return new UserCredential(credential, userInfo);
    }

    // Create UserCredential instance from login response
    static fromAuthResponse(authResponse: any, deviceId: string): UserCredential {
        const credential: Credential = {
            UserGuid: authResponse.user?.userGuid || '',
            UsingDeviceId: deviceId,
            RefreshToken: authResponse.refreshToken || '',
            AccessToken: authResponse.accessToken || '',
            RefreshTokenExpiresAtTimestamp: authResponse.refreshTokenExpiresAtTimestamp || 0,
            AccessTokenExpiresAtTimestamp: authResponse.accessTokenExpiresAtTimestamp || 0,
        };
        
        return new UserCredential(credential, authResponse.user);
    }
}