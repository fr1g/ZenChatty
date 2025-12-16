import { ApiClientBase } from './base';
import { BasicResponse } from '../models/auth';
import { ChatResponse } from '../models/chat';
import { Contact } from '../models/other';
import { UserInfoQueryRequest } from '../models/requests';
import { User, UserInfoResponse } from '../models';
import { Tools } from '../tools';
import { Message } from '../models/message';

export class ContactApiClient extends ApiClientBase {
    constructor(baseUrl: string, timeout: number = 10000) {
        super(baseUrl, timeout);
    }

    /**
     * 查询用户信息（根据隐私设置过滤） was-named: queryUserInfo
     */
    async queryOthersInfoByPrivacy(finding: string): Promise<UserInfoResponse> {
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
     * FINAL adding friend. before that, use: sendFriendRequest
     * @param targetUserGuid the GUID string of target user
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
     * 获取用户的所有联系人
     */
    async getContacts(): Promise<Contact[]> {
        return await this.post<Contact[]>('/api/social/contact/list');
    }

    async getRecentContacts(): Promise<Contact[]> {
        return await this.post<Contact[]>('/api/social/contact/recent');
    }

    /**
     * 发送好友请求
     */
    async sendFriendRequest(targetUserGuid: string, viaGroupGuid?: string): Promise<BasicResponse> {
        const assembly = viaGroupGuid ? `&viaGroupId=${viaGroupGuid}` : '';
        return await this.post(`/api/social/add-friend-request?targetUserId=${targetUserGuid}${assembly}`);
    }

    /**
     * 接受好友请求
     */
    async acceptFriendRequest(requestMessageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/accept-friend-request?requestMessageId=${requestMessageId}`);
    }

    /**
     * 拒绝好友请求
     */
    async rejectFriendRequest(requestMessageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/reject-friend-request?requestMessageId=${requestMessageId}`);
    }

    /**
     * 获取收到的待处理好友请求
     */
    async getPendingFriendRequests(): Promise<Message[]> {
        return await this.get<Message[]>('/api/social/friend-requests/pending');
    }

    /**
     * 获取已发送的好友请求
     */
    async getSentFriendRequests(): Promise<Message[]> {
        return await this.get<Message[]>('/api/social/friend-requests/sent');
    }

    /**
     * 撤销好友请求
     */
    async revokeFriendRequest(requestMessageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/revoke-friend-request?requestMessageId=${requestMessageId}`);
    }

    /**
     * 获取好友列表
     */
    async getFriends(): Promise<Contact[]> {
        return await this.get<Contact[]>('/api/social/friends');
    }

    /**
     * 解除好友关系
     */
    async removeFriend(targetUserId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/remove-friend/${targetUserId}`);
    }

    /**
     * 删除对话（从联系人列表中移除，不删除聊天记录）
     */
    async deleteContact(contactId: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/social/contact/${contactId}`);
    }
}