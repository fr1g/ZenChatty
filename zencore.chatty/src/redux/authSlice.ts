import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthActs, AuthStoreMgrActs } from '../actions/authRelated';
import { Credential } from '../models/front';
import { AuthError } from '../actions/authRelated';
import { LoginDataForm, RegDataForm } from '../actions/authRelated';

// 异步 thunk 用于登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    {
      loginData,
      clientConfig,
      storageMethod
    }: {
      loginData: LoginDataForm;
      clientConfig?: any;
      storageMethod: (object: any) => any;
    },
    { rejectWithValue }
  ) => {
    try {
      let credential = await AuthActs.login(loginData, clientConfig, storageMethod);
      return credential;
    } catch (error) {
      if (error instanceof AuthError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('登录失败，请检查网络连接');
    }
  }
);

// 异步 thunk 用于注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    {
      registerData,
      clientConfig
    }: {
      registerData: RegDataForm;
      clientConfig?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await AuthActs.register(registerData, clientConfig);
      return result;
    } catch (error) {
      if (error instanceof AuthError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('注册失败，请检查网络连接');
    }
  }
);

// 异步 thunk 用于刷新 token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (
    {
      credential,
      clientConfig,
      storageMethod,
      beforeSpan = 123
    }: {
      credential: Credential;
      clientConfig?: any;
      storageMethod: (object: any) => any;
      beforeSpan?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const newCredential = await AuthActs.refreshIfNeeded(
        credential,
        clientConfig,
        storageMethod,
        beforeSpan
      );
      return newCredential;
    } catch (error) {
      if (error instanceof AuthError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Token 刷新失败');
    }
  }
);

// 异步 thunk 用于登出
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (
    {
      credential,
      clientConfig,
      storageMethod
    }: {
      credential: Credential;
      clientConfig?: any;
      storageMethod: (object: any) => any;
    },
    { rejectWithValue }
  ) => {
    try {
      await AuthActs.logoff(credential, storageMethod, clientConfig);
      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('登出失败');
    }
  }
);

export interface AuthState {
  credential: Credential | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registerLoading: boolean;
  registerError: string | null;
  registerSuccess: boolean;
}

const initialState: AuthState = {
  credential: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registerLoading: false,
  registerError: null,
  registerSuccess: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 手动设置凭证（用于从存储中恢复登录状态）
    setCredential: (state, action: PayloadAction<Credential>) => {
      state.credential = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    // 清除错误
    clearError: (state) => {
      state.error = null;
      state.registerError = null;
    },
    // 重置注册状态
    resetRegisterState: (state) => {
      state.registerLoading = false;
      state.registerError = null;
      state.registerSuccess = false;
    },
    // 清除所有状态（完全重置）
    clearAuthState: (state) => {
      state.credential = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.registerLoading = false;
      state.registerError = null;
      state.registerSuccess = false;
    }
  },
  extraReducers: (builder) => {
    // 登录处理
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.credential = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.credential = null;
      })

      // 注册处理
      .addCase(registerUser.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
        state.registerSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.registerLoading = false;
        state.registerSuccess = true;
        state.registerError = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registerLoading = false;
        state.registerError = action.payload as string;
        state.registerSuccess = false;
      })

      // Token 刷新处理
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.credential = action.payload;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.credential = null;
      })

      // 登出处理
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.credential = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // 即使登出失败，也清除本地状态
        state.credential = null;
        state.isAuthenticated = false;
      });
  }
});

export const { setCredential, clearError, resetRegisterState, clearAuthState } = authSlice.actions;
export default authSlice.reducer;