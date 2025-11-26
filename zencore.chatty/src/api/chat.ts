import { ApiClientBase } from './base';
import { ChatResponse } from '../models/chat';
import { CreatePrivateChatRequest } from '../models/requests';

/**
 * 聊天API客户端
 */
export class ChatApiClient extends ApiClientBase {
  /**
   * 创建私聊
   * @param request - 创建私聊请求
   * @returns 聊天响应
   */
  public async createPrivateChat(request: CreatePrivateChatRequest): Promise<ChatResponse> {
    return await this.post<ChatResponse>('/api/social/private-chat', request);
  }

}