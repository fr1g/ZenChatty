import { ApiClientBase } from './base';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest, BasicResponse, UserInfo } from '../models/auth';
import { Tools } from '../tools';

export class AuthApiClient extends ApiClientBase {
    /**
     * 用户登录
     * @param request - 登录请求
     * @returns 认证响应
     */
    public async login(request: LoginRequest): Promise<AuthResponse> {
        return await this.post<AuthResponse>('/api/auth/login', request);
    }

    /**
     * 用户注册
     * @param request - 注册请求
     * @returns 基础响应
     */
    public async register(request: RegisterRequest): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/auth/register', request);
    }

    /**
     * 刷新访问令牌
     * @param request - 刷新令牌请求
     * @returns 认证响应
     */
    public async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
        return await this.patch<AuthResponse>('/api/auth/refresh', request);
    }

    /**
     * 用户登出
     * @param deviceId ID of current device and will attached to header: X-Device-Id
     * @returns 基础响应
     */
    public async logout(deviceId: string): Promise<BasicResponse> {
        // this.client.head.
        this.setDeviceIdInHeader(deviceId);
        return await this.post<BasicResponse>('/api/auth/logout');
    }

    /**
     * 验证令牌
     * @returns 基础响应
     */
    public async validateToken(): Promise<BasicResponse> {
        return await this.get<BasicResponse>('/api/auth/validate');
    }

    /**
     * 获取用户's 信息
     * @returns 用户信息
     */
    public async getUserInfo(): Promise<UserInfo> {
        return await this.get<UserInfo>('/api/auth/userinfo');
    }

    /**
     * 禁用用户 @deprecated ??????
     * @param userId - 用户ID
     * @returns 基础响应
     */
    public async disableUser(userId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/auth/disable/${userId}`);
    }

    /**
     * 心跳检测
     * @returns 基础响应
     */
    public async touch(): Promise<BasicResponse> {
        return await this.get<BasicResponse>('/api/auth/touch');
    }
}