import { ApiClientBase } from './base';
import { Message, SendMessageResponse } from '../models/message';
import { BasicResponse } from '../models/auth';
export declare class MessageApiClient extends ApiClientBase {
    /**
     * 获取聊天消息
     * @param chatId - 聊天ID
     * @param page - 页码
     * @param pageSize - 每页大小
     * @returns 消息列表
     */
    getMessages(chatId: string, page?: number, pageSize?: number): Promise<Message[]>;
    /**
     * 发送文本消息
     * @param chatId - 聊天ID
     * @param content - 消息内容
     * @returns 发送消息响应
     */
    sendTextMessage(chatId: string, content: string): Promise<SendMessageResponse>;
    /**
     * 发送图片消息
     * @param chatId - 聊天ID
     * @param imageFile - 图片文件
     * @param caption - 图片描述（可选）
     * @returns 发送消息响应
     */
    sendImageMessage(chatId: string, imageFile: File, caption?: string): Promise<SendMessageResponse>;
    /**
     * 发送文件消息
     * @param chatId - 聊天ID
     * @param file - 文件
     * @returns 发送消息响应
     */
    sendFileMessage(chatId: string, file: File): Promise<SendMessageResponse>;
    /**
     * 删除消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    deleteMessage(chatId: string, messageId: string): Promise<BasicResponse>;
    /**
     * 编辑消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param newContent - 新内容
     * @returns 基础响应
     */
    editMessage(chatId: string, messageId: string, newContent: string): Promise<BasicResponse>;
    /**
     * 撤回消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    recallMessage(chatId: string, messageId: string): Promise<BasicResponse>;
    /**
     * 转发消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param targetChatId - 目标聊天ID
     * @returns 基础响应
     */
    forwardMessage(chatId: string, messageId: string, targetChatId: string): Promise<BasicResponse>;
    /**
     * 标记消息为已读
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    markMessageAsRead(chatId: string, messageId: string): Promise<BasicResponse>;
    /**
     * 搜索消息
     * @param chatId - 聊天ID
     * @param query - 搜索关键词
     * @returns 消息列表
     */
    searchMessages(chatId: string, query: string): Promise<Message[]>;
    /**
     * 获取消息详情
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 消息详情
     */
    getMessage(chatId: string, messageId: string): Promise<Message>;
}
//# sourceMappingURL=message.d.ts.map