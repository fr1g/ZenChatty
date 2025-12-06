import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Contact } from '../models';

// 联系人状态接口
export interface ContactState {
  recentContactList: Contact[];
  allContacts: Contact[];
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: ContactState = {
  recentContactList: [],
  allContacts: [],
  isLoading: false,
  error: null
};

export const contactSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    // 更新最近联系人列表
    updateRecentContact: (state, action: PayloadAction<Contact>) => {
      const existingIndex = state.recentContactList.findIndex(
        contact => contact.contactId === action.payload.contactId
      );

      if (existingIndex >= 0) {
        // 如果已存在，更新并移到最前面
        state.recentContactList.splice(existingIndex, 1);
      }

      // 添加到列表最前面
      state.recentContactList.unshift(action.payload);

      // 限制最近联系人数量（例如最近20个）
      if (state.recentContactList.length > 20) {
        state.recentContactList = state.recentContactList.slice(0, 20);
      }
    },

    // 更新单个联系人
    updateContact: (state, action: PayloadAction<Contact>) => {
      // 更新所有联系人列表
      const allIndex = state.allContacts.findIndex(
        contact => contact.contactId === action.payload.contactId
      );
      if (allIndex >= 0) {
        state.allContacts[allIndex] = action.payload;
      } else {
        state.allContacts.push(action.payload);
      }

      // 更新最近联系人列表
      const recentIndex = state.recentContactList.findIndex(
        contact => contact.contactId === action.payload.contactId
      );
      if (recentIndex >= 0) {
        state.recentContactList[recentIndex] = action.payload;
      }
    },

    // 设置所有联系人
    setAllContacts: (state, action: PayloadAction<Contact[]>) => {
      state.allContacts = action.payload;
    },

    // 设置最近联系人列表
    setRecentContacts: (state, action: PayloadAction<Contact[]>) => {
      state.recentContactList = action.payload;
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
    resetContacts: (state) => {
      state.recentContactList = [];
      state.allContacts = [];
      state.isLoading = false;
      state.error = null;
    }
  }
});

// 导出actions
export const {
  updateRecentContact,
  updateContact,
  setAllContacts,
  setRecentContacts,
  setLoading,
  setError,
  clearError,
  resetContacts
} = contactSlice.actions;

// 导出reducer
export default contactSlice.reducer;