import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../models/message';

// 消息状态接口
export interface MessageState {
  messageList: Message[];
  unreadCounts: Record<string, number>; // contactId -> unreadCount
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: MessageState = {
  messageList: [],
  unreadCounts: {},
  isLoading: false,
  error: null
};

export const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // 添加新消息
    addNewMessage: (state, action: PayloadAction<Message>) => {
      // 检查是否已存在相同traceId的消息
      const existingIndex = state.messageList.findIndex(
        message => message.traceId === action.payload.traceId
      );
      
      if (existingIndex === -1) {
        // 添加新消息到列表最前面
        state.messageList.unshift(action.payload);
        
        // 限制消息数量（例如最近100条）
        if (state.messageList.length > 100) {
          state.messageList = state.messageList.slice(0, 100);
        }
      }
    },
    
    // 批量添加消息
    addMessages: (state, action: PayloadAction<Message[]>) => {
      action.payload.forEach(message => {
        const existingIndex = state.messageList.findIndex(
          msg => msg.traceId === message.traceId
        );
        
        if (existingIndex === -1) {
          state.messageList.unshift(message);
        }
      });
      
      // 限制消息数量
      if (state.messageList.length > 100) {
        state.messageList = state.messageList.slice(0, 100);
      }
    },
    
    // 更新未读计数
    updateUnreadCount: (state, action: PayloadAction<{contactId: string, unreadCount: number}>) => {
      state.unreadCounts[action.payload.contactId] = action.payload.unreadCount;
    },
    
    // 清除消息列表
    clearMessages: (state) => {
      state.messageList = [];
    },
    
    // 设置加载状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // 设置错误信息
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    
    // 重置状态
    resetMessages: (state) => {
      state.messageList = [];
      state.unreadCounts = {};
      state.isLoading = false;
      state.error = null;
    }
  }
});

// 导出actions
export const {
  addNewMessage,
  addMessages,
  updateUnreadCount,
  clearMessages,
  setLoading,
  setError,
  clearError,
  resetMessages
} = messageSlice.actions;

// 导出reducer
export default messageSlice.reducer;