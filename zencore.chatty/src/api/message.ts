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
     * @param size 一次查询多少消息
     * @param since 数字类型的时间戳，查询自【since】前发出的消息
     * @returns 消息列表
     */
    public async getMessageHistory(chatUniqueMark: string, size: number = 10, since: number = ((new Date()).getTime())): Promise<Message[]> {
        return await this.get<Message[]>(`/api/msg/history/${chatUniqueMark}?queryMessageAmount=${size}&fromTimestamp=${since}`);
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