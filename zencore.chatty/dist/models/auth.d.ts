export declare class AuthResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    deviceId: string;
    userInfo: UserInfo;
}
export declare class UserInfo {
    userId: string;
    username: string;
    displayName: string;
    email: string;
    status: string;
}
export declare class LoginRequest {
    username: string;
    password: string;
    deviceId: string;
}
export declare class RegisterRequest {
    email: string;
    username: string;
    password: string;
    displayName: string;
    deviceId: string;
}
export declare class RefreshTokenRequest {
    refreshToken: string;
    deviceId: string;
}
export declare class BasicResponse {
    success: boolean;
    message: string;
}
//# sourceMappingURL=auth.d.ts.map