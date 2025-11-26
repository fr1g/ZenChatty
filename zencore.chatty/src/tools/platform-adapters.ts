/**
 * 平台适配器 - 为不同平台提供存储实现
 */

import { AuthStorage } from './auth-storage';

/**
 * React Native AsyncStorage 适配器
 */
export class ReactNativeAuthStorage implements AuthStorage {
  private asyncStorage: any;

  constructor(asyncStorage: any) {
    this.asyncStorage = asyncStorage;
  }

  async saveToken(token: string): Promise<void> {
    await this.asyncStorage.setItem('@ZenChatty:auth_token', token);
  }

  async getToken(): Promise<string | null> {
    return await this.asyncStorage.getItem('@ZenChatty:auth_token');
  }

  async removeToken(): Promise<void> {
    await this.asyncStorage.removeItem('@ZenChatty:auth_token');
  }

  async saveUserInfo(userInfo: any): Promise<void> {
    await this.asyncStorage.setItem('@ZenChatty:user_info', JSON.stringify(userInfo));
  }

  async getUserInfo(): Promise<any | null> {
    const data = await this.asyncStorage.getItem('@ZenChatty:user_info');
    return data ? JSON.parse(data) : null;
  }

  async removeUserInfo(): Promise<void> {
    await this.asyncStorage.removeItem('@ZenChatty:user_info');
  }

  async clear(): Promise<void> {
    await this.asyncStorage.multiRemove([
      '@ZenChatty:auth_token',
      '@ZenChatty:user_info'
    ]);
  }
}

/**
 * Web localStorage 适配器
 */
export class WebAuthStorage implements AuthStorage {
  private readonly tokenKey = 'zenchatty_auth_token';
  private readonly userInfoKey = 'zenchatty_user_info';

  async saveToken(token: string): Promise<void> {
    localStorage.setItem(this.tokenKey, token);
  }

  async getToken(): Promise<string | null> {
    return localStorage.getItem(this.tokenKey);
  }

  async removeToken(): Promise<void> {
    localStorage.removeItem(this.tokenKey);
  }

  async saveUserInfo(userInfo: any): Promise<void> {
    localStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));
  }

  async getUserInfo(): Promise<any | null> {
    const data = localStorage.getItem(this.userInfoKey);
    return data ? JSON.parse(data) : null;
  }

  async removeUserInfo(): Promise<void> {
    localStorage.removeItem(this.userInfoKey);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userInfoKey);
  }
}

/**
 * 安全存储适配器 - 支持加密存储
 */
export class SecureAuthStorage implements AuthStorage {
  private storage: AuthStorage;
  private encryptionKey: string;

  constructor(storage: AuthStorage, encryptionKey: string) {
    this.storage = storage;
    this.encryptionKey = encryptionKey;
  }

  private encrypt(data: string): string {
    // 简单的Base64加密（实际项目中应使用更安全的加密方法）
    return btoa(data);
  }

  private decrypt(encryptedData: string): string {
    // 简单的Base64解密
    return atob(encryptedData);
  }

  async saveToken(token: string): Promise<void> {
    const encrypted = this.encrypt(token);
    await this.storage.saveToken(encrypted);
  }

  async getToken(): Promise<string | null> {
    const encrypted = await this.storage.getToken();
    return encrypted ? this.decrypt(encrypted) : null;
  }

  async removeToken(): Promise<void> {
    await this.storage.removeToken();
  }

  async saveUserInfo(userInfo: any): Promise<void> {
    const encrypted = this.encrypt(JSON.stringify(userInfo));
    await this.storage.saveUserInfo(encrypted);
  }

  async getUserInfo(): Promise<any | null> {
    const encrypted = await this.storage.getUserInfo();
    return encrypted ? JSON.parse(this.decrypt(encrypted)) : null;
  }

  async removeUserInfo(): Promise<void> {
    await this.storage.removeUserInfo();
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}

/**
 * 平台检测工具
 */
export class PlatformDetector {
  static isReactNative(): boolean {
    return typeof navigator === 'undefined' || 
           (navigator.product === 'ReactNative');
  }

  static isWeb(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.localStorage !== 'undefined';
  }

  static isNodeJS(): boolean {
    return typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
  }

  /**
   * 根据平台创建合适的存储适配器
   */
  static createPlatformStorage(): AuthStorage {
    if (this.isReactNative()) {
      // React Native 环境
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return new ReactNativeAuthStorage(AsyncStorage);
      } catch (error) {
        console.warn('AsyncStorage not available, falling back to memory storage');
        return new (require('./auth-storage').MemoryAuthStorage)();
      }
    } else if (this.isWeb()) {
      // Web 环境
      return new WebAuthStorage();
    } else {
      // Node.js 或其他环境
      return new (require('./auth-storage').MemoryAuthStorage)();
    }
  }
}