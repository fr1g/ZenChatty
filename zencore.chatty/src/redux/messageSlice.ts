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
    addNewMessage: (state, action: PayloadAction<Message>) => {
      const existingIndex = state.messageList.findIndex(
        message => message.traceId === action.payload.traceId
      );
      
      if (existingIndex === -1) {
        state.messageList.unshift(action.payload);
        if (state.messageList.length > 100) {
          state.messageList = state.messageList.slice(0, 100);
        }
      }
    },

    addMessages: (state, action: PayloadAction<Message[]>) => {
      action.payload.forEach(message => {
        const existingIndex = state.messageList.findIndex(
          msg => msg.traceId === message.traceId
        );
        
        if (existingIndex === -1) {
          state.messageList.unshift(message);
        }
      });

      if (state.messageList.length > 100) {
        state.messageList = state.messageList.slice(0, 100);
      }
    },

    updateUnreadCount: (state, action: PayloadAction<{contactId: string, unreadCount: number}>) => {
      state.unreadCounts[action.payload.contactId] = action.payload.unreadCount;
    },

    clearMessages: (state) => {
      state.messageList = [];
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
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