/**
 * 认证存储接口 - 定义平台无关的存储操作
 */
export interface AuthStorage {
  /**
   * 保存认证令牌
   */
  saveToken(token: string): Promise<void>;
  
  /**
   * 获取认证令牌
   */
  getToken(): Promise<string | null>;
  
  /**
   * 删除认证令牌
   */
  removeToken(): Promise<void>;
  
  /**
   * 保存用户信息
   */
  saveUserInfo(userInfo: any): Promise<void>;
  
  /**
   * 获取用户信息
   */
  getUserInfo(): Promise<any | null>;
  
  /**
   * 删除用户信息
   */
  removeUserInfo(): Promise<void>;
  
  /**
   * 清空所有认证数据
   */
  clear(): Promise<void>;
}

/**
 * 默认内存存储 - 用于测试和开发环境
 */
export class MemoryAuthStorage implements AuthStorage {
  private token: string | null = null;
  private userInfo: any = null;

  async saveToken(token: string): Promise<void> {
    this.token = token;
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async removeToken(): Promise<void> {
    this.token = null;
  }

  async saveUserInfo(userInfo: any): Promise<void> {
    this.userInfo = userInfo;
  }

  async getUserInfo(): Promise<any | null> {
    return this.userInfo;
  }

  async removeUserInfo(): Promise<void> {
    this.userInfo = null;
  }

  async clear(): Promise<void> {
    this.token = null;
    this.userInfo = null;
  }
}

/**
 * 认证管理器 - 核心工具类
 */
export class AuthManager {
  private storage: AuthStorage;
  private token: string | null = null;
  private userInfo: any = null;
  private isAuthenticated: boolean = false;

  constructor(storage?: AuthStorage) {
    this.storage = storage || new MemoryAuthStorage();
    this.initialize();
  }

  /**
   * 初始化认证状态
   */
  private async initialize(): Promise<void> {
    try {
      this.token = await this.storage.getToken();
      this.userInfo = await this.storage.getUserInfo();
      this.isAuthenticated = !!this.token;
    } catch (error) {
      console.warn('Failed to initialize auth state:', error);
    }
  }

  /**
   * 设置认证存储
   */
  setStorage(storage: AuthStorage): void {
    this.storage = storage;
    this.initialize();
  }

  /**
   * 登录并保存认证信息
   */
  async login(token: string, userInfo: any): Promise<void> {
    try {
      await this.storage.saveToken(token);
      await this.storage.saveUserInfo(userInfo);
      
      this.token = token;
      this.userInfo = userInfo;
      this.isAuthenticated = true;
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await this.storage.clear();
      
      this.token = null;
      this.userInfo = null;
      this.isAuthenticated = false;
    } catch (error) {
      throw new Error(`Logout failed: ${error}`);
    }
  }

  /**
   * 获取认证令牌
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 获取用户信息
   */
  getUserInfo(): any | null {
    return this.userInfo;
  }

  /**
   * 检查是否已认证
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * 刷新令牌
   */
  async refreshToken(newToken: string): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('Cannot refresh token: not authenticated');
    }
    
    try {
      await this.storage.saveToken(newToken);
      this.token = newToken;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error}`);
    }
  }
}