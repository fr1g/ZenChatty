export class AuthResponse {
    public accessToken: string = '';
    public refreshToken: string = '';
    public accessTokenExpiresAt: Date = new Date();
    public refreshTokenExpiresAt: Date = new Date();
    public deviceId: string = '';
    public userInfo: UserInfo = new UserInfo();
}

export class UserInfo {
    public userId: string = '';
    public username: string = '';
    public displayName: string = '';
    public email: string = '';
    public status: string = '';
}

export class LoginRequest {
    public username?: string;
    public password?: string;
    public deviceId?: string;
}

export class RegisterRequest {
    public uniqueCustomId?: string;
    public password?: string;
    public displayName?: string;
    public email?: string;
    public gender?: string;
    public birthday?: Date;
    public bio?: string;
}

export class RefreshTokenRequest {
    public refreshToken?: string;
    public deviceId?: string;
}

export class BasicResponse {
    public success: boolean = false;
    public message: string = '';
}