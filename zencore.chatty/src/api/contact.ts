import { ApiClientBase } from './base';
import { Contact } from '../models/other';
import { BasicResponse } from '../models/auth';

export class ContactApiClient extends ApiClientBase {
    /**
     * 获取联系人列表
     * @returns 联系人列表
     */
    public async getContacts(): Promise<Contact[]> {
        return await this.get<Contact[]>('/api/contacts');
    }

    /**
     * 添加联系人
     * @param userId - 用户ID
     * @param remark - 备注名（可选）
     * @returns 基础响应
     */
    public async addContact(userId: string, remark?: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/contacts', { userId, remark });
    }

    /**
     * 删除联系人
     * @param contactId - 联系人ID
     * @returns 基础响应
     */
    public async deleteContact(contactId: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/contacts/${contactId}`);
    }

    /**
     * 更新联系人备注
     * @param contactId - 联系人ID
     * @param remark - 新备注
     * @returns 基础响应
     */
    public async updateContactRemark(contactId: string, remark: string): Promise<BasicResponse> {
        return await this.put<BasicResponse>(`/api/contacts/${contactId}/remark`, { remark });
    }

    /**
     * 获取联系人详情
     * @param contactId - 联系人ID
     * @returns 联系人详情
     */
    public async getContact(contactId: string): Promise<Contact> {
        return await this.get<Contact>(`/api/contacts/${contactId}`);
    }

    /**
     * 搜索联系人
     * @param query - 搜索关键词
     * @returns 联系人列表
     */
    public async searchContacts(query: string): Promise<Contact[]> {
        return await this.get<Contact[]>(`/api/contacts/search?q=${encodeURIComponent(query)}`);
    }

    /**
     * 获取联系人请求列表
     * @returns 联系人请求列表
     */
    public async getContactRequests(): Promise<any[]> {
        return await this.get<any[]>('/api/contacts/requests');
    }

    /**
     * 发送联系人请求
     * @param userId - 用户ID
     * @param message - 请求消息（可选）
     * @returns 基础响应
     */
    public async sendContactRequest(userId: string, message?: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/contacts/requests', { userId, message });
    }

    /**
     * 接受联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    public async acceptContactRequest(requestId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/contacts/requests/${requestId}/accept`);
    }

    /**
     * 拒绝联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    public async rejectContactRequest(requestId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/contacts/requests/${requestId}/reject`);
    }

    /**
     * 取消联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    public async cancelContactRequest(requestId: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/contacts/requests/${requestId}`);
    }

    /**
     * 获取联系人分组
     * @returns 联系人分组列表
     */
    public async getContactGroups(): Promise<any[]> {
        return await this.get<any[]>('/api/contacts/groups');
    }

    /**
     * 创建联系人分组
     * @param name - 分组名称
     * @returns 基础响应
     */
    public async createContactGroup(name: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/contacts/groups', { name });
    }

    /**
     * 删除联系人分组
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    public async deleteContactGroup(groupId: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/contacts/groups/${groupId}`);
    }

    /**
     * 移动联系人到分组
     * @param contactId - 联系人ID
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    public async moveContactToGroup(contactId: string, groupId: string): Promise<BasicResponse> {
        return await this.put<BasicResponse>(`/api/contacts/${contactId}/group`, { groupId });
    }
}