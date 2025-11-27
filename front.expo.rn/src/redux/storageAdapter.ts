import { SQLiteStorageAdapter } from '../database/SQLiteStorageAdapter';
import type { StorageMethods as ZenStorageMethods } from 'zen-core-chatty-ts';

// 创建SQLite存储适配器实例
const sqliteAdapter = new SQLiteStorageAdapter();

// 跨平台存储适配器 - 符合zen-core-chatty-ts的StorageMethods接口
export const StorageMethods: ZenStorageMethods = {
  // 存储方法，wipe=true表示清除，false表示存储
  storageMethod: async (object: any, wipe: boolean): Promise<any> => {
    try {
      if (wipe) {
        // 清除数据 - 根据对象类型决定清除策略
        if (object && object.user_guid) {
          // 清除用户相关数据
          await sqliteAdapter.deleteCredential(object.user_guid);
          console.log('清除用户凭据:', object.user_guid);
        }
        return null;
      } else {
        // 存储数据 - 根据对象类型决定存储策略
        if (object && object.user_guid) {
          // 存储用户凭据
          await sqliteAdapter.saveCredential(object);
          console.log('存储用户凭据:', object.user_guid);
        }
        return object;
      }
    } catch (error) {
      console.error('存储方法错误:', error);
      return null;
    }
  },

  // 读取方法，返回Credential或Credential[]
  readMethod: async (): Promise<any> => {
    try {
      // 这里需要实现读取逻辑，暂时返回空数组
      // 在实际应用中，应该从数据库读取所有凭据或特定凭据
      console.log('读取存储方法被调用');
      return [];
    } catch (error) {
      console.error('读取方法错误:', error);
      return null;
    }
  },
};

// 存储键常量（保留用于兼容性）
export const STORAGE_KEYS = {
  REDUX_STORE: 'redux-store',
  AUTH_CREDENTIALS: 'auth-credentials',
};

// 初始化SQLite存储适配器
export const initializeStorage = async (): Promise<void> => {
  try {
    await sqliteAdapter.initialize();
    console.log('SQLite存储适配器初始化完成');
  } catch (error) {
    console.error('SQLite存储适配器初始化失败:', error);
    throw error;
  }
};