import { ApiClientBase } from './base';
import { Contact } from '../models/other';
import { BasicResponse } from '../models/auth';
export declare class ContactApiClient extends ApiClientBase {
    /**
     * 获取联系人列表
     * @returns 联系人列表
     */
    getContacts(): Promise<Contact[]>;
    /**
     * 添加联系人
     * @param userId - 用户ID
     * @param remark - 备注名（可选）
     * @returns 基础响应
     */
    addContact(userId: string, remark?: string): Promise<BasicResponse>;
    /**
     * 删除联系人
     * @param contactId - 联系人ID
     * @returns 基础响应
     */
    deleteContact(contactId: string): Promise<BasicResponse>;
    /**
     * 更新联系人备注
     * @param contactId - 联系人ID
     * @param remark - 新备注
     * @returns 基础响应
     */
    updateContactRemark(contactId: string, remark: string): Promise<BasicResponse>;
    /**
     * 获取联系人详情
     * @param contactId - 联系人ID
     * @returns 联系人详情
     */
    getContact(contactId: string): Promise<Contact>;
    /**
     * 搜索联系人
     * @param query - 搜索关键词
     * @returns 联系人列表
     */
    searchContacts(query: string): Promise<Contact[]>;
    /**
     * 获取联系人请求列表
     * @returns 联系人请求列表
     */
    getContactRequests(): Promise<any[]>;
    /**
     * 发送联系人请求
     * @param userId - 用户ID
     * @param message - 请求消息（可选）
     * @returns 基础响应
     */
    sendContactRequest(userId: string, message?: string): Promise<BasicResponse>;
    /**
     * 接受联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    acceptContactRequest(requestId: string): Promise<BasicResponse>;
    /**
     * 拒绝联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    rejectContactRequest(requestId: string): Promise<BasicResponse>;
    /**
     * 取消联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    cancelContactRequest(requestId: string): Promise<BasicResponse>;
    /**
     * 获取联系人分组
     * @returns 联系人分组列表
     */
    getContactGroups(): Promise<any[]>;
    /**
     * 创建联系人分组
     * @param name - 分组名称
     * @returns 基础响应
     */
    createContactGroup(name: string): Promise<BasicResponse>;
    /**
     * 删除联系人分组
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    deleteContactGroup(groupId: string): Promise<BasicResponse>;
    /**
     * 移动联系人到分组
     * @param contactId - 联系人ID
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    moveContactToGroup(contactId: string, groupId: string): Promise<BasicResponse>;
}
//# sourceMappingURL=contact.d.ts.map