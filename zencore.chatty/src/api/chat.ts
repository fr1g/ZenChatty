import { ApiClientBase } from './base';
import { ChatResponse } from '../models/chat';
import { BasicResponse } from '../models/auth';
import { CreatePrivateChatRequest, CreateGroupChatRequest } from '../models/requests';

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
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async leaveGroupChat(chatId: string): Promise<BasicResponse> {
    return await this.post<BasicResponse>(`/api/social/group/leave/${chatId}`);
  }

  /**
   * 获取群公告
   * @param chatId - 聊天ID
   * @returns 群公告内容
   */
  public async getGroupAnnouncement(chatId: string): Promise<string> {
    return await this.get<string>(`/api/social/group/announcement/${chatId}`);
  }

}