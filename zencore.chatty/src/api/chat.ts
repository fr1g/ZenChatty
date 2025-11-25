import { ApiClientBase } from './base';
import { ChatResponse } from '../models/chat';
import { BasicResponse } from '../models/auth';
import { CreatePrivateChatRequest, CreateGroupChatRequest } from '../models/requests';

/**
 * 聊天API客户端
 */
export class ChatApiClient extends ApiClientBase {
  /**
   * 获取用户聊天列表
   * @returns 聊天响应列表
   */
  public async getChats(): Promise<ChatResponse[]> {
    return await this.get<ChatResponse[]>('/api/chat');
  }

  /**
   * 获取指定聊天详情
   * @param chatId - 聊天ID
   * @returns 聊天响应
   */
  public async getChat(chatId: string): Promise<ChatResponse> {
    return await this.get<ChatResponse>(`/api/chat/${chatId}`);
  }

  /**
   * 创建私聊
   * @param request - 创建私聊请求
   * @returns 聊天响应
   */
  public async createPrivateChat(request: CreatePrivateChatRequest): Promise<ChatResponse> {
    return await this.post<ChatResponse>('/api/chat/private', request);
  }

  /**
   * 创建群聊
   * @param request - 创建群聊请求
   * @returns 聊天响应
   */
  public async createGroupChat(request: CreateGroupChatRequest): Promise<ChatResponse> {
    return await this.post<ChatResponse>('/api/chat/group', request);
  }

  /**
   * 删除聊天
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async deleteChat(chatId: string): Promise<BasicResponse> {
    return await this.delete<BasicResponse>(`/api/chat/${chatId}`);
  }

  /**
   * 置顶聊天
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async pinChat(chatId: string): Promise<BasicResponse> {
    return await this.post<BasicResponse>(`/api/chat/${chatId}/pin`);
  }

  /**
   * 取消置顶聊天
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async unpinChat(chatId: string): Promise<BasicResponse> {
    return await this.delete<BasicResponse>(`/api/chat/${chatId}/pin`);
  }

  /**
   * 屏蔽聊天
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async blockChat(chatId: string): Promise<BasicResponse> {
    return await this.post<BasicResponse>(`/api/chat/${chatId}/block`);
  }

  /**
   * 取消屏蔽聊天
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async unblockChat(chatId: string): Promise<BasicResponse> {
    return await this.delete<BasicResponse>(`/api/chat/${chatId}/block`);
  }

  /**
   * 标记聊天为已读
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async markAsRead(chatId: string): Promise<BasicResponse> {
    return await this.post<BasicResponse>(`/api/chat/${chatId}/read`);
  }

  /**
   * 清空聊天记录
   * @param chatId - 聊天ID
   * @returns 基础响应
   */
  public async clearChatHistory(chatId: string): Promise<BasicResponse> {
    return await this.delete<BasicResponse>(`/api/chat/${chatId}/history`);
  }

  /**
   * 获取聊天成员
   * @param chatId - 聊天ID
   * @returns 用户信息列表
   */
  public async getChatMembers(chatId: string): Promise<any[]> {
    return await this.get<any[]>(`/api/chat/${chatId}/members`);
  }

  /**
   * 添加聊天成员
   * @param chatId - 聊天ID
   * @param userId - 用户ID
   * @returns 基础响应
   */
  public async addChatMember(chatId: string, userId: string): Promise<BasicResponse> {
    return await this.post<BasicResponse>(`/api/chat/${chatId}/members`, { userId });
  }

  /**
   * 移除聊天成员
   * @param chatId - 聊天ID
   * @param userId - 用户ID
   * @returns 基础响应
   */
  public async removeChatMember(chatId: string, userId: string): Promise<BasicResponse> {
    return await this.delete<BasicResponse>(`/api/chat/${chatId}/members/${userId}`);
  }
}