import { ApiClientBase } from './base';
import { BasicResponse } from '../models/auth';
import { PrivacySettings, PrivacySettingsResponse } from '../models/other';

/**
 * 隐私设置API客户端
 */
export class PrivacyApiClient extends ApiClientBase {
  /**
   * 更新隐私设置
   * @param settings - 隐私设置
   * @returns 基础响应
   */
  public async updatePrivacySettings(settings: PrivacySettings): Promise<BasicResponse> {
    return await this.post<BasicResponse>('/api/social/privacy/update', settings);
  }

  /**
   * 获取隐私设置
   * @returns 隐私设置响应
   */
  public async getPrivacySettings(): Promise<PrivacySettingsResponse> {
    return await this.get<PrivacySettingsResponse>('/api/social/privacy/get');
  }

  /**
   * 检查隐私设置（检查是否可以查看用户信息）
   * @param targetUserId - 目标用户ID
   * @returns 基础响应（success=true表示可以查看）
   */
  public async checkPrivacySettings(targetUserId: string): Promise<BasicResponse> {
    return await this.post<BasicResponse>('/api/social/privacy/check', { targetUserId });
  }
}