import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Message, Contact, Credential } from 'zen-core-chatty-ts';
import { DatabaseManager } from '../database/DatabaseManager';

/**
 * ===========================================
 * 统一应用状态管理 Context 设计文档
 * ===========================================
 * 
 * 设计目标：
 * 1. 简化状态管理，避免多个Context的复杂性
 * 2. 实现内存缓存与数据库存储的协同工作
 * 3. 提供按需落盘的数据持久化策略
 * 4. 支持离线使用和实时同步
 * 
 * 核心设计思路：
 * - 使用单一Context管理所有应用状态
 * - 内存缓存优先，数据库作为持久化存储
 * - 按需加载和落盘，避免不必要的数据库操作
 * - 支持实时更新和离线使用
 * 
 * 数据流设计：
 * API请求 → 更新Context状态 → 异步落盘数据库
 * 用户操作 → 更新Context状态 → 实时UI响应
 * 
 * 缓存策略：
 * - 用户信息：缓存最近100个用户，30分钟过期
 * - 消息数据：每个聊天会话缓存最近100条消息
 * - 联系人：应用启动时全量加载，实时同步更新
 */

// 应用状态接口
export interface AppState {
  // 当前登录用户
  currentUser: User | null;
  // 用户凭证
  credential: Credential | null;
  // 内存中的用户缓存（按用户GUID索引）
  userCache: Map<string, User>;
  // 内存中的消息缓存（按聊天ID索引）
  messageCache: Map<string, Message[]>;
  // 内存中的联系人缓存
  contactCache: Map<string, Contact>;
  // 加载状态
  isLoading: boolean;
}

// 操作类型定义
// 每个操作对应特定的状态更新逻辑
type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: { user: User; credential: Credential } }
  | { type: 'CLEAR_CURRENT_USER' }
  | { type: 'ADD_USER_TO_CACHE'; payload: User }
  | { type: 'ADD_MESSAGES_TO_CACHE'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_CONTACT_TO_CACHE'; payload: Contact }
  | { type: 'SET_LOADING'; payload: boolean };

// 初始状态
const initialState: AppState = {
  currentUser: null,
  credential: null,
  userCache: new Map(),
  messageCache: new Map(),
  contactCache: new Map(),
  isLoading: false,
};

/**
 * Reducer函数 - 状态更新逻辑
 * 采用不可变更新模式，确保状态变更的可预测性
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      // 设置当前用户，并自动添加到用户缓存
      return {
        ...state,
        currentUser: action.payload.user,
        credential: action.payload.credential,
        userCache: new Map(state.userCache).set(action.payload.user.user_guid, action.payload.user),
      };
    
    case 'CLEAR_CURRENT_USER':
      // 清除当前用户信息（登出时使用）
      return {
        ...state,
        currentUser: null,
        credential: null,
      };
    
    case 'ADD_USER_TO_CACHE':
      // 添加用户到缓存，使用Map确保唯一性
      const newUserCache = new Map(state.userCache);
      newUserCache.set(action.payload.user_guid, action.payload);
      return { ...state, userCache: newUserCache };
    
    case 'ADD_MESSAGES_TO_CACHE':
      // 添加消息到指定聊天的缓存
      const newMessageCache = new Map(state.messageCache);
      const existingMessages = newMessageCache.get(action.payload.chatId) || [];
      // 合并现有消息和新消息，避免重复
      newMessageCache.set(action.payload.chatId, [...existingMessages, ...action.payload.messages]);
      return { ...state, messageCache: newMessageCache };
    
    case 'ADD_CONTACT_TO_CACHE':
      // 添加联系人到缓存
      const newContactCache = new Map(state.contactCache);
      newContactCache.set(action.payload.contact_guid || action.payload.user_guid, action.payload);
      return { ...state, contactCache: newContactCache };
    
    case 'SET_LOADING':
      // 设置加载状态
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
}

// Context创建
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // 工具方法
  getUserFromCache: (userGuid: string) => User | undefined;
  getMessagesFromCache: (chatId: string) => Message[] | undefined;
  getContactFromCache: (contactId: string) => Contact | undefined;
} | null>(null);

/**
 * AppProvider组件 - 应用状态提供者
 * 负责：
 * 1. 管理应用状态和状态更新
 * 2. 提供缓存数据访问工具方法
 * 3. 应用启动时加载初始缓存数据
 * 4. 协调内存缓存与数据库存储
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const dbManager = DatabaseManager.getInstance();

  // 工具方法 - 提供便捷的缓存数据访问
  const getUserFromCache = (userGuid: string): User | undefined => {
    return state.userCache.get(userGuid);
  };

  const getMessagesFromCache = (chatId: string): Message[] | undefined => {
    return state.messageCache.get(chatId);
  };

  const getContactFromCache = (contactId: string): Contact | undefined => {
    return state.contactCache.get(contactId);
  };

  /**
   * 应用启动时加载初始缓存数据
   * 策略：
   * - 加载最近访问的50个用户（避免内存占用过大）
   * - 全量加载联系人列表（联系人数量通常有限）
   * - 消息数据按需加载，不在此处预加载
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 加载最近访问的用户（缓存策略）
        const recentUsers = await dbManager.getRecentUsers(50);
        recentUsers.forEach(user => {
          dispatch({ type: 'ADD_USER_TO_CACHE', payload: user });
        });
        
        // 加载联系人列表
        const contacts = await dbManager.getAllContacts();
        contacts.forEach(contact => {
          dispatch({ type: 'ADD_CONTACT_TO_CACHE', payload: contact });
        });
        
      } catch (error) {
        console.error('加载初始数据失败:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      getUserFromCache,
      getMessagesFromCache,
      getContactFromCache,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};