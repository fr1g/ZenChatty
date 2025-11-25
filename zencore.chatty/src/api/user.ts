import { ApiClientBase } from './base';
import { UserInfoResponse } from '../models/user';
import { BasicResponse } from '../models/auth';
import { PrivacySettingsResponse } from '../models/other';

export class UserApiClient extends ApiClientBase {
    /**
     * 获取当前用户信息
     * @returns 用户信息响应
     */
    public async getCurrentUserInfo(): Promise<UserInfoResponse> {
        return await this.get<UserInfoResponse>('/api/user/me');
    }

    /**
     * 获取指定用户信息
     * @param userId - 用户ID
     * @returns 用户信息响应
     */
    public async getUserInfo(userId: string): Promise<UserInfoResponse> {
        return await this.get<UserInfoResponse>(`/api/user/${userId}`);
    }

    /**
     * 更新用户信息
     * @param userInfo - 用户信息
     * @returns 基础响应
     */
    public async updateUserInfo(userInfo: Partial<UserInfoResponse>): Promise<BasicResponse> {
        return await this.put<BasicResponse>('/api/user/profile', userInfo);
    }

    /**
     * 更新用户头像
     * @param avatarFile - 头像文件
     * @returns 基础响应
     */
    public async updateAvatar(avatarFile: File): Promise<BasicResponse> {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        return await this.post<BasicResponse>('/api/user/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    /**
     * 更新用户背景
     * @param backgroundFile - 背景文件
     * @returns 基础响应
     */
    public async updateBackground(backgroundFile: File): Promise<BasicResponse> {
        const formData = new FormData();
        formData.append('background', backgroundFile);

        return await this.post<BasicResponse>('/api/user/background', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    /**
     * 搜索用户
     * @param query - 搜索关键词
     * @returns 用户信息响应列表
     */
    public async searchUsers(query: string): Promise<UserInfoResponse[]> {
        return await this.get<UserInfoResponse[]>(`/api/user/search?q=${encodeURIComponent(query)}`);
    }

    /**
     * 获取用户隐私设置
     * @returns 隐私设置响应
     */
    public async getPrivacySettings(): Promise<PrivacySettingsResponse> {
        return await this.get<PrivacySettingsResponse>('/api/user/privacy');
    }

    /**
     * 更新用户隐私设置
     * @param settings - 隐私设置
     * @returns 基础响应
     */
    public async updatePrivacySettings(settings: Partial<PrivacySettingsResponse>): Promise<BasicResponse> {
        return await this.put<BasicResponse>('/api/user/privacy', settings);
    }

    /**
     * 获取用户在线状态
     * @param userId - 用户ID
     * @returns 在线状态
     */
    public async getUserStatus(userId: string): Promise<{ status: string; lastSeen: Date }> {
        return await this.get<{ status: string; lastSeen: Date }>(`/api/user/${userId}/status`);
    }

    /**
     * 更新用户在线状态
     * @param status - 状态
     * @returns 基础响应
     */
    public async updateUserStatus(status: string): Promise<BasicResponse> {
        return await this.put<BasicResponse>('/api/user/status', { status });
    }
}