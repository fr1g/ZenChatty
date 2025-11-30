import { ApiClientBase } from './base';
import { BasicResponse } from '../models/auth';
import { ChatResponse } from '../models/chat';
import { Contact } from '../models/other';
import { UserInfoQueryRequest } from '../models/requests';
import { User, UserInfoResponse } from '../models';
import { Tools } from '../tools';

export class ContactApiClient extends ApiClientBase {
    constructor(baseUrl: string, timeout: number = 10000) {
        super(baseUrl, timeout);
    }

    /**
     * 查询用户信息（根据隐私设置过滤）
     */
    async queryUserInfo(finding: string): Promise<UserInfoResponse> {
        if (Tools.isNoneOrEmpty(finding)) throw new Error("Empty Finding for.");
        return await this.post<UserInfoResponse>(`/api/social/get-user-info/${finding}`);
    }

    /**
     * 检查用户是否被禁用
     */
    async checkUserIsDisabled(targetUserId: string): Promise<BasicResponse> {
        return await this.get<BasicResponse>(`/api/social/is-disabled/${targetUserId}`);
    }

    /**
     * 拉黑/取消拉黑用户
     */
    async blockUser(targetUserId: string, block: boolean = true): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/block/${targetUserId}`, null, {
            params: { block }
        });
    }

    /**
     * 解除拉黑并添加好友
     */
    async unblockAndAddFriend(targetUserId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/unblock-and-add/${targetUserId}`);
    }

    /**
     * 添加好友
     */
    async addFriend(targetUserGuid: string): Promise<ChatResponse> {
        return await this.post<ChatResponse>(`/api/social/add-friend/${targetUserGuid}`);
    }

    /**
     * 检查两个用户之间的拉黑状态
     */
    async checkBlockStatus(targetUserId: string): Promise<BasicResponse> {
        return await this.get<BasicResponse>(`/api/social/is-blocked/${targetUserId}`);
    }

    /**
     * 更新未读消息计数
     */
    async updateUnreadCount(contactId: string, unreadCount: number): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/contact/get-unread/${contactId}`, null, {
            params: { unreadCount }
        });
    }

    /**
     * 获取用户的所有联系人
     */
    async getContacts(): Promise<Contact[]> {
        return await this.post<Contact[]>('/api/social/contact/list');
    }

    async sendFriendRequest(targetUserGuid: string, viaGroupGuid?: string): Promise<BasicResponse> {
        const assembly = viaGroupGuid ? `&viaGroupId=${viaGroupGuid}` : '';
        return await this.post(`/api/social/add-friend-request?targetUserId=${targetUserGuid}${assembly}`);
    }
}