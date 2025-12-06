// Redux Toolkit 相关导出
import type { RootState, AppDispatch } from './store';
export { store } from './store';
export type { RootState, AppDispatch };
export { default as authReducer } from './authSlice';
export { default as contactReducer } from './contactSlice';
export { default as messageReducer } from './messageSlice';

export * from './authSlice';

export {
  updateRecentContact,
  updateContact,
  setAllContacts,
  setRecentContacts,
  clearError as contactClearError,
  resetContacts
} from './contactSlice';

export {
  addNewMessage,
  addMessages,
  updateUnreadCount,
  clearMessages,
  setLoading as messageSetLoading,
  setError as messageSetError,
  clearError as messageClearError,
  resetMessages
} from './messageSlice';

// Redux hooks 类型定义
export type UseAppSelector = <TSelected>(selector: (state: RootState) => TSelected) => TSelected;

export type UseAppDispatch = () => AppDispatch;

// 跨平台存储方法接口
export interface StorageMethods {
  // 存储方法，wipe=true 表示清除，false 表示存储
  storageMethod: (object: any, wipe: boolean) => any;
  // 读取方法，返回 Credential 或 Credential[]
  readMethod: () => any;
}

// 工具函数：检查 token 是否即将过期
export const isTokenExpiringSoon = (
  credential: { AccessTokenExpiresAtTimestamp: number } | null,
  beforeSpan: number = 5 * 60 * 1000 // 默认5分钟前检查
): boolean => {
  if (!credential) return false;
  const now = Date.now();
  return now + beforeSpan > credential.AccessTokenExpiresAtTimestamp;
};

// 工具函数：自动刷新 token 的包装器
export const withAutoRefresh = async (
  credential: any,
  clientConfig: any,
  storageMethods: StorageMethods,
  action: () => Promise<any>,
  beforeSpan: number = 123
): Promise<any> => {
  if (isTokenExpiringSoon(credential, beforeSpan)) {
    // 如果需要刷新，先刷新 token
    const { refreshToken } = await import('./authSlice');
    // 这里需要在实际使用时通过 store.dispatch 调用
    // 这是一个工具函数，实际调用需要在应用上下文中进行
  }
  return await action();
};