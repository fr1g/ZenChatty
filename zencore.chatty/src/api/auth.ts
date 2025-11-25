import { ApiClientBase } from './base';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest, BasicResponse } from '../models/auth';

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
     * @returns 认证响应
     */
    public async register(request: RegisterRequest): Promise<AuthResponse> {
        return await this.post<AuthResponse>('/api/auth/register', request);
    }

    /**
     * 刷新访问令牌
     * @param request - 刷新令牌请求
     * @returns 认证响应
     */
    public async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
        return await this.post<AuthResponse>('/api/auth/refresh', request);
    }

    /**
     * 用户登出
     * @returns 基础响应
     */
    public async logout(): Promise<BasicResponse> {
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
     * 请求密码重置
     * @param email - 用户邮箱
     * @returns 基础响应
     */
    public async requestPasswordReset(email: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/auth/forgot-password', { email });
    }

    /**
     * 重置密码
     * @param token - 重置令牌
     * @param newPassword - 新密码
     * @returns 基础响应
     */
    public async resetPassword(token: string, newPassword: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/auth/reset-password', {
            token,
            newPassword
        });
    }
}