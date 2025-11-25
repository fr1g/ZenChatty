import { ApiClientBase } from './base';
import { ChatResponse } from '../models/chat';
import { BasicResponse } from '../models/auth';
import { CreatePrivateChatRequest, CreateGroupChatRequest } from '../models/requests';
/**
 * 聊天API客户端
 */
export declare class ChatApiClient extends ApiClientBase {
    /**
     * 获取用户聊天列表
     * @returns 聊天响应列表
     */
    getChats(): Promise<ChatResponse[]>;
    /**
     * 获取指定聊天详情
     * @param chatId - 聊天ID
     * @returns 聊天响应
     */
    getChat(chatId: string): Promise<ChatResponse>;
    /**
     * 创建私聊
     * @param request - 创建私聊请求
     * @returns 聊天响应
     */
    createPrivateChat(request: CreatePrivateChatRequest): Promise<ChatResponse>;
    /**
     * 创建群聊
     * @param request - 创建群聊请求
     * @returns 聊天响应
     */
    createGroupChat(request: CreateGroupChatRequest): Promise<ChatResponse>;
    /**
     * 删除聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    deleteChat(chatId: string): Promise<BasicResponse>;
    /**
     * 置顶聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    pinChat(chatId: string): Promise<BasicResponse>;
    /**
     * 取消置顶聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    unpinChat(chatId: string): Promise<BasicResponse>;
    /**
     * 屏蔽聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    blockChat(chatId: string): Promise<BasicResponse>;
    /**
     * 取消屏蔽聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    unblockChat(chatId: string): Promise<BasicResponse>;
    /**
     * 标记聊天为已读
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    markAsRead(chatId: string): Promise<BasicResponse>;
    /**
     * 清空聊天记录
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    clearChatHistory(chatId: string): Promise<BasicResponse>;
    /**
     * 获取聊天成员
     * @param chatId - 聊天ID
     * @returns 用户信息列表
     */
    getChatMembers(chatId: string): Promise<any[]>;
    /**
     * 添加聊天成员
     * @param chatId - 聊天ID
     * @param userId - 用户ID
     * @returns 基础响应
     */
    addChatMember(chatId: string, userId: string): Promise<BasicResponse>;
    /**
     * 移除聊天成员
     * @param chatId - 聊天ID
     * @param userId - 用户ID
     * @returns 基础响应
     */
    removeChatMember(chatId: string, userId: string): Promise<BasicResponse>;
}
//# sourceMappingURL=chat.d.ts.map