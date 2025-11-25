import { ApiClientBase } from './base';
import { Message, SendMessageResponse } from '../models/message';
import { BasicResponse } from '../models/auth';

export class MessageApiClient extends ApiClientBase {
    /**
     * 获取聊天消息
     * @param chatId - 聊天ID
     * @param page - 页码
     * @param pageSize - 每页大小
     * @returns 消息列表
     */
    public async getMessages(chatId: string, page: number = 1, pageSize: number = 50): Promise<Message[]> {
        return await this.get<Message[]>(`/api/chat/${chatId}/messages?page=${page}&pageSize=${pageSize}`);
    }

    /**
     * 发送文本消息
     * @param chatId - 聊天ID
     * @param content - 消息内容
     * @returns 发送消息响应
     */
    public async sendTextMessage(chatId: string, content: string): Promise<SendMessageResponse> {
        return await this.post<SendMessageResponse>(`/api/chat/${chatId}/messages/text`, { content });
    }

    /**
     * 发送图片消息
     * @param chatId - 聊天ID
     * @param imageFile - 图片文件
     * @param caption - 图片描述（可选）
     * @returns 发送消息响应
     */
    public async sendImageMessage(chatId: string, imageFile: File, caption?: string): Promise<SendMessageResponse> {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (caption) {
            formData.append('caption', caption);
        }

        return await this.post<SendMessageResponse>(`/api/chat/${chatId}/messages/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    /**
     * 发送文件消息
     * @param chatId - 聊天ID
     * @param file - 文件
     * @returns 发送消息响应
     */
    public async sendFileMessage(chatId: string, file: File): Promise<SendMessageResponse> {
        const formData = new FormData();
        formData.append('file', file);

        return await this.post<SendMessageResponse>(`/api/chat/${chatId}/messages/file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    /**
     * 删除消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    public async deleteMessage(chatId: string, messageId: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/chat/${chatId}/messages/${messageId}`);
    }

    /**
     * 编辑消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param newContent - 新内容
     * @returns 基础响应
     */
    public async editMessage(chatId: string, messageId: string, newContent: string): Promise<BasicResponse> {
        return await this.put<BasicResponse>(`/api/chat/${chatId}/messages/${messageId}`, { content: newContent });
    }

    /**
     * 撤回消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    public async recallMessage(chatId: string, messageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/chat/${chatId}/messages/${messageId}/recall`);
    }

    /**
     * 转发消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param targetChatId - 目标聊天ID
     * @returns 基础响应
     */
    public async forwardMessage(chatId: string, messageId: string, targetChatId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/chat/${chatId}/messages/${messageId}/forward`, { targetChatId });
    }

    /**
     * 标记消息为已读
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    public async markMessageAsRead(chatId: string, messageId: string): Promise<BasicResponse> {
        return await this.post<BasicResponse>(`/api/chat/${chatId}/messages/${messageId}/read`);
    }

    /**
     * 搜索消息
     * @param chatId - 聊天ID
     * @param query - 搜索关键词
     * @returns 消息列表
     */
    public async searchMessages(chatId: string, query: string): Promise<Message[]> {
        return await this.get<Message[]>(`/api/chat/${chatId}/messages/search?q=${encodeURIComponent(query)}`);
    }

    /**
     * 获取消息详情
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 消息详情
     */
    public async getMessage(chatId: string, messageId: string): Promise<Message> {
        return await this.get<Message>(`/api/chat/${chatId}/messages/${messageId}`);
    }
}