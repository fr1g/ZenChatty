import { ApiClientBase } from './base';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest, BasicResponse, UserInfo } from '../models/auth';
import { Tools } from '../tools';
import { EGender, User } from '../models';

export class AuthApiClient extends ApiClientBase {

    public async login(request: LoginRequest): Promise<AuthResponse> {
        return await this.post<AuthResponse>('/api/auth/login', request);
    }

    public async register(request: RegisterRequest): Promise<BasicResponse> {
        // i cannot understand why this in-class function cannot be found. IDIOT.
        const req = {
            ...request,
            password: request.password?.trim().replaceAll(" ", ""),
            email: request.email?.trim().replaceAll(" ", ""),
            uniqueCustomId: request.uniqueCustomId?.trim().replaceAll(" ", ""),
        } as RegisterRequest;
        return await this.post<BasicResponse>('/api/auth/register', req);
    }


    public async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
        return await this.patch<AuthResponse>('/api/auth/refresh', request);
    }


    public async logout(deviceId: string): Promise<BasicResponse> {
        // this.client.head.
        this.setDeviceIdInHeader(deviceId);
        return await this.post<BasicResponse>('/api/auth/logout');
    }


    public async validateToken(): Promise<BasicResponse> {
        return await this.get<BasicResponse>('/api/auth/validate');
    }


    public async getUserInfo(): Promise<User> {
        return await this.get<User>('/api/auth/userinfo');
    }

    /**
     * @deprecated
     */
    public async disableUser(userId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/auth/disable/${userId}`);
    }

}

