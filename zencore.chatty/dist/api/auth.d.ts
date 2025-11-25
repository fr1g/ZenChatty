import { ApiClientBase } from './base';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest, BasicResponse } from '../models/auth';
export declare class AuthApiClient extends ApiClientBase {
    /**
     * 用户登录
     * @param request - 登录请求
     * @returns 认证响应
     */
    login(request: LoginRequest): Promise<AuthResponse>;
    /**
     * 用户注册
     * @param request - 注册请求
     * @returns 认证响应
     */
    register(request: RegisterRequest): Promise<AuthResponse>;
    /**
     * 刷新访问令牌
     * @param request - 刷新令牌请求
     * @returns 认证响应
     */
    refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>;
    /**
     * 用户登出
     * @returns 基础响应
     */
    logout(): Promise<BasicResponse>;
    /**
     * 验证令牌
     * @returns 基础响应
     */
    validateToken(): Promise<BasicResponse>;
    /**
     * 请求密码重置
     * @param email - 用户邮箱
     * @returns 基础响应
     */
    requestPasswordReset(email: string): Promise<BasicResponse>;
    /**
     * 重置密码
     * @param token - 重置令牌
     * @param newPassword - 新密码
     * @returns 基础响应
     */
    resetPassword(token: string, newPassword: string): Promise<BasicResponse>;
}
//# sourceMappingURL=auth.d.ts.map