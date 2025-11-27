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

    // 检查访问令牌是否即将过期
    isAccessTokenExpiringSoon(): boolean {
        const now = Date.now();
        const threshold = 5 * 60 * 1000; // 5分钟阈值
        return this.accessTokenExpiresAtTimestamp - now <= threshold;
    }

    // 检查刷新令牌是否即将过期
    isRefreshTokenExpiringSoon(): boolean {
        const now = Date.now();
        const threshold = 24 * 60 * 60 * 1000; // 24小时阈值
        return this.refreshTokenExpiresAtTimestamp - now <= threshold;
    }

    // 转换为 SDK 中的 Credential 类型
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

    // 从 SDK 中的 Credential 创建 UserCredential 实例
    static fromCredential(credential: Credential, userInfo?: User): UserCredential {
        return new UserCredential(credential, userInfo);
    }

    // 从登录响应创建 UserCredential 实例
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