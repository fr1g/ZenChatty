import { ApiClientBase } from './base';

import { BasicResponse } from '../models/auth';
import { Contact } from '../models/other';
import { PrivacySettings, PrivacySettingsResponse } from '../models/other';

export class UserApiClient extends ApiClientBase {

    /**
     * 检查用户是否被禁用
     * @param targetUserId - 目标用户ID
     * @returns 是否被禁用
     */
    public async isUserDisabled(targetUserId: string): Promise<boolean> {
        return await this.get<boolean>(`/api/social/is-disabled/${targetUserId}`);
    }

    /**
     * 屏蔽用户
     * @param targetUserId - 目标用户ID
     * @returns 基础响应
     */
    public async blockUser(targetUserId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/block/${targetUserId}`);
    }

    /**
     * 取消屏蔽并添加好友
     * @param targetUserId - 目标用户ID
     * @returns 基础响应
     */
    public async unblockAndAddFriend(targetUserId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/unblock-and-add/${targetUserId}`);
    }

    /**
     * 添加好友
     * @param targetUserGuid - 目标用户GUID
     * @returns 基础响应
     */
    public async addFriend(targetUserGuid: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/add-friend/${targetUserGuid}`);
    }

    /**
     * 检查拉黑状态
     * @param targetUserId - 目标用户ID
     * @returns 基础响应
     */
    public async checkBlockStatus(targetUserId: string): Promise<BasicResponse> {
        return await this.get<BasicResponse>(`/api/social/is-blocked/${targetUserId}`);
    }



    /**
     * 更新未读消息数
     * @param contactId - 联系人ID
     * @param unreadCount - 未读消息数
     * @returns 基础响应
     */
    public async updateUnreadCount(contactId: string, unreadCount: number): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/contact/get-unread/${contactId}?unreadCount=${unreadCount}`);
    }

    /**
     * 获取联系人列表
     * @returns 联系人列表
     */
    public async getContacts(): Promise<Contact[]> {
        return await this.post<Contact[]>('/api/social/contact/list');
    }

    /**
     * 更新隐私设置
     * @param settings - 隐私设置
     * @returns 基础响应
     */
    public async updatePrivacySettings(settings: PrivacySettings): Promise<BasicResponse> {
        return await this.patch<BasicResponse>('/api/social/privacy/update', settings);
    }

    /**
     * 获取隐私设置
     * @returns 隐私设置响应
     */
    public async getPrivacySettings(): Promise<PrivacySettingsResponse> {
        return await this.get<PrivacySettingsResponse>('/api/social/privacy/get');
    }
}