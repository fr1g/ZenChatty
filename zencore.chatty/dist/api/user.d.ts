import { ApiClientBase } from './base';
import { UserInfoResponse } from '../models/user';
import { BasicResponse } from '../models/auth';
import { PrivacySettingsResponse } from '../models/other';
export declare class UserApiClient extends ApiClientBase {
    /**
     * 获取当前用户信息
     * @returns 用户信息响应
     */
    getCurrentUserInfo(): Promise<UserInfoResponse>;
    /**
     * 获取指定用户信息
     * @param userId - 用户ID
     * @returns 用户信息响应
     */
    getUserInfo(userId: string): Promise<UserInfoResponse>;
    /**
     * 更新用户信息
     * @param userInfo - 用户信息
     * @returns 基础响应
     */
    updateUserInfo(userInfo: Partial<UserInfoResponse>): Promise<BasicResponse>;
    /**
     * 更新用户头像
     * @param avatarFile - 头像文件
     * @returns 基础响应
     */
    updateAvatar(avatarFile: File): Promise<BasicResponse>;
    /**
     * 更新用户背景
     * @param backgroundFile - 背景文件
     * @returns 基础响应
     */
    updateBackground(backgroundFile: File): Promise<BasicResponse>;
    /**
     * 搜索用户
     * @param query - 搜索关键词
     * @returns 用户信息响应列表
     */
    searchUsers(query: string): Promise<UserInfoResponse[]>;
    /**
     * 获取用户隐私设置
     * @returns 隐私设置响应
     */
    getPrivacySettings(): Promise<PrivacySettingsResponse>;
    /**
     * 更新用户隐私设置
     * @param settings - 隐私设置
     * @returns 基础响应
     */
    updatePrivacySettings(settings: Partial<PrivacySettingsResponse>): Promise<BasicResponse>;
    /**
     * 获取用户在线状态
     * @param userId - 用户ID
     * @returns 在线状态
     */
    getUserStatus(userId: string): Promise<{
        status: string;
        lastSeen: Date;
    }>;
    /**
     * 更新用户在线状态
     * @param status - 状态
     * @returns 基础响应
     */
    updateUserStatus(status: string): Promise<BasicResponse>;
}
//# sourceMappingURL=user.d.ts.map