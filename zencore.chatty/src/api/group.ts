import { ApiClientBase } from './base';
import { BasicResponse } from '../models/auth';
import { ChatResponse } from '../models/chat';
import { Message } from '../models/message';
import { UpdateGroupSettingsRequest, GroupManagementRequest, GroupInviteLinkRequest, CreateGroupChatRequest } from '../models/requests';

export interface GroupSettings {
    groupId: string;
    groupName: string;
    description?: string;
    maxMembers: number;
    allowInvite: boolean;
    requireApproval: boolean;
    createdAt: Date;
    createdBy: string;
}

export interface GroupInviteLink {
    inviteCode: string;
    groupId: string;
    createdBy: string;
    createdAt: Date;
    expiresAt?: Date;
    maxUses?: number;
    currentUses: number;
}

export class GroupApiClient extends ApiClientBase {
    /**
     * 创建群聊
     * @param request - 创建群聊请求
     * @returns 聊天响应
     */
    public async createGroupChat(request: CreateGroupChatRequest): Promise<ChatResponse> {
        return await this.post<ChatResponse>('/api/social/group/create', request);
    }

    /**
     * 退出群聊
     * @param groupId - 群聊ID
     * @returns 基础响应
     */
    public async leaveGroup(groupId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/social/group/leave-from/${groupId}`);
    }

    /**
     * 获取群公告
     * @param groupId - 群聊ID
     * @param page - 页码
     * @param pageSize - 每页大小
     * @returns 消息列表
     */
    public async getGroupAnnouncements(groupId: string, page: number = 1, pageSize: number = 20): Promise<Message[]> {
        return await this.get<Message[]>(`/api/social/group/get-announcements/${groupId}?page=${page}&pageSize=${pageSize}`);
    }

    /**
     * 更新群设置
     * @param request - 更新群设置请求
     * @returns 基础响应
     */
    public async updateGroupSettings(request: UpdateGroupSettingsRequest): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/group-management/settings', request);
    }

    /**
     * 切换全员禁言状态
     * @param groupId - 群组ID
     * @param isSilent - 是否禁言
     * @param reason - 禁言原因
     * @returns 基础响应
     */
    public async toggleSilentAll(groupId: string, isSilent: boolean = true, reason?: string): Promise<BasicResponse> {
        const params = new URLSearchParams();
        params.append('isSilent', isSilent.toString());
        if (reason) params.append('reason', reason);
        
        return await this.post<BasicResponse>(`/api/group-management/toggle-silent-all/${groupId}?${params}`);
    }

    /**
     * 标记消息为公告
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    public async markMessageAsAnnouncement(messageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/group-management/announcements/add/${messageId}`);
    }

    /**
     * 取消标记公告
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    public async unmarkAnnouncement(messageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/group-management/announcements/del/${messageId}`);
    }

    /**
     * 禁用群组
     * @param groupId - 群组ID
     * @returns 基础响应
     */
    public async disableGroup(groupId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/group-management/disable/${groupId}`);
    }

    /**
     * 启用群组
     * @param groupId - 群组ID
     * @returns 基础响应
     */
    public async enableGroup(groupId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/group-management/enable/${groupId}`);
    }

    /**
     * 设置/取消管理员
     * @param request - 管理员设置请求
     * @param isAdmin - 是否为管理员
     * @returns 基础响应
     */
    public async setGroupAdmin(request: GroupManagementRequest, isAdmin: boolean = true): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/group-management/toggle-admin/${isAdmin}`, request);
    }

    /**
     * 设置禁言状态
     * @param request - 禁言状态设置请求
     * @param isSilent - 是否禁言
     * @returns 基础响应
     */
    public async setMemberSilent(request: GroupManagementRequest, isSilent: boolean = true): Promise<BasicResponse> {
        const params = new URLSearchParams();
        params.append('isSilent', isSilent.toString());
        
        return await this.post<BasicResponse>(`/api/group-management/set-silent-status?${params}`, request);
    }

    /**
     * 移除群成员
     * @param request - 移除成员请求
     * @returns 基础响应
     */
    public async removeGroupMember(request: GroupManagementRequest): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/group-management/remove-member', request);
    }

    /**
     * 设置群成员昵称
     * @param request - 昵称设置请求
     * @returns 基础响应
     */
    public async setMemberNickname(request: GroupManagementRequest): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/group-management/nickname', request);
    }

    /**
     * 邀请群成员
     * @param request - 邀请成员请求
     * @returns 基础响应
     */
    public async inviteMember(request: GroupManagementRequest): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/group-management/debug/invite-member', request);
    }

    /**
     * 创建邀请链接
     * @param request - 创建邀请链接请求
     * @returns 邀请链接
     */
    public async createInviteLink(request: GroupInviteLinkRequest): Promise<GroupInviteLink> {
        return await this.post<GroupInviteLink>('/api/group-management/invite-link/new', request);
    }

    /**
     * 使用邀请链接
     * @param inviteCode - 邀请码
     * @returns 基础响应
     */
    public async consumeInviteLink(inviteCode: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/group-management/invite-link/consume/${inviteCode}`);
    }

    /**
     * 获取群邀请链接列表
     * @param groupId - 群组ID
     * @returns 邀请链接列表
     */
    public async getInviteLinks(groupId: string): Promise<GroupInviteLink[]> {
        return await this.get<GroupInviteLink[]>(`/api/group-management/invite-link/list/${groupId}`);
    }

    /**
     * 删除邀请链接
     * @param inviteCode - 邀请码
     * @returns 基础响应
     */
    public async deleteInviteLink(inviteCode: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/group-management/invite-link/del/${inviteCode}`);
    }
}