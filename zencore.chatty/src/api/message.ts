import { ApiClientBase } from './base';
import { Message } from '../models/message';
import { BasicResponse } from '../models/auth';
import { SendMessageRequest, SendMessageResponse, RecallMessageRequest } from '../models/requests';

export class MessageApiClient extends ApiClientBase {
    /**
     * 发送消息
     * @param request - 发送消息请求
     * @returns 发送消息响应
     */
    public async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        return await this.post<SendMessageResponse>('/api/msg/send', request);
    }

    /**
     * 获取消息历史
     * @param chatUniqueMark - 聊天唯一标识
     * @param page - 页码
     * @param pageSize - 每页大小
     * @returns 消息列表
     */
    public async getMessageHistory(chatUniqueMark: string, page: number = 1, pageSize: number = 50): Promise<Message[]> {
        return await this.get<Message[]>(`/api/msg/history/${chatUniqueMark}?page=${page}&pageSize=${pageSize}`);
    }

    /**
     * 获取未读消息数量
     * @returns 未读消息数量字典（聊天ID -> 未读数量）
     */
    public async getUnreadCount(): Promise<Record<string, number>> {
        return await this.get<Record<string, number>>('/api/msg/unread/count');
    }

    /**
     * 撤回消息
     * @param request - 撤回消息请求
     * @returns 基础响应
     */
    public async recallMessage(request: RecallMessageRequest): Promise<BasicResponse> {
        return await this.post<BasicResponse>('/api/msg/recall', request);
    }
}