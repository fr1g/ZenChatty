import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthActs, AuthStoreMgrActs } from '../actions/authRelated';
import { Credential } from '../models/front';
import { User } from '../models/user';
import { AuthError } from '../actions/authRelated';
import { LoginDataForm, RegDataForm } from '../models/auth';
import { ClientInitObject, CreateZenCoreClient, ZenCoreClient } from '../api';

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
            // 记录详细错误信息到console
            console.error('登录失败 - 详细错误信息:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                loginData: { username: loginData.login, password: '***' } // 隐藏密码
            });

            if (error instanceof AuthError) {
                return rejectWithValue(`登录失败: ${error.message}`);
            }

            // 返回详细的错误信息
            const errorMessage = error instanceof Error
                ? `登录失败: ${error.message}`
                : '登录失败，请检查网络连接';
            return rejectWithValue(errorMessage);
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
            // 记录详细错误信息到console
            console.error('注册失败 - 详细错误信息:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                registerData: {
                    username: registerData.customUserId,
                    email: registerData.email,
                    password: '***' // 隐藏密码
                }
            });

            if (error instanceof AuthError) {
                return rejectWithValue(`注册失败: ${error.message}`);
            }

            // 返回详细的错误信息
            const errorMessage = error instanceof Error
                ? `注册失败: ${error.message}`
                : '注册失败，请检查网络连接';
            return rejectWithValue(errorMessage);
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
            // 记录详细错误信息到console
            console.error('Token刷新失败 - 详细错误信息:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                credential: {
                    access_token: credential.AccessToken ?? 'null',
                    refresh_token: credential.RefreshToken ?? 'null'
                }
            });

            if (error instanceof AuthError) {
                return rejectWithValue(`Token刷新失败: ${error.message}`);
            }

            // 返回详细的错误信息
            const errorMessage = error instanceof Error
                ? `Token刷新失败: ${error.message}`
                : 'Token刷新失败，请检查网络连接';
            return rejectWithValue(errorMessage);
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
            storageMethod: (object: any, wipe: boolean) => any;
        },
        { rejectWithValue }
    ) => {
        try {
            await AuthActs.logoff(credential, storageMethod, clientConfig);
            return true;
        } catch (error) {
            // 记录详细错误信息到console
            console.error('登出失败 - 详细错误信息:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                credential: {
                    access_token: credential.AccessToken ?? 'null',
                    refresh_token: credential.RefreshToken ?? 'null'
                }
            });

            if (error instanceof AuthError) {
                return rejectWithValue(`登出失败: ${error.message}`);
            }

            // 返回详细的错误信息
            const errorMessage = error instanceof Error
                ? `登出失败: ${error.message}`
                : '登出失败，请检查网络连接';
            return rejectWithValue(errorMessage);
        }
    }
);

export const fetchUserInfo = createAsyncThunk(
    'auth/fetchUserInfo',
    async (
        {
            credential,
            clientConfig
        }: {
            credential: Credential;
            clientConfig?: ClientInitObject;
        },
        { rejectWithValue }
    ) => {
        try {
            let client: ZenCoreClient;
            if (clientConfig) client = CreateZenCoreClient(clientConfig);
            else client = new ZenCoreClient();

            client.setAuthToken(credential.AccessToken);
            const userInfo = await client.auth.getUserInfo();

            return userInfo;
        } catch (error) {
            console.error('获取用户信息失败 - 详细错误信息:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                credential: {
                    access_token: credential.AccessToken ?? 'null',
                    user_guid: credential.UserGuid ?? 'null'
                }
            });

            if (error instanceof AuthError) {
                return rejectWithValue(`获取用户信息失败: ${error.message}`);
            }

            // 返回详细的错误信息
            const errorMessage = error instanceof Error
                ? `获取用户信息失败: ${error.message}`
                : '获取用户信息失败，请检查网络连接';
            return rejectWithValue(errorMessage);
        }
    }
);

export interface AuthState {
    credential: Credential | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    registerLoading: boolean;
    registerError: string | null;
    registerSuccess: boolean;
    userInfoLoading: boolean;
    userInfoError: string | null;
}

const initialState: AuthState = {
    credential: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    registerLoading: false,
    registerError: null,
    registerSuccess: false,
    userInfoLoading: false,
    userInfoError: null
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
        // 设置用户信息
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },
        // 清除用户信息
        clearUser: (state) => {
            state.user = null;
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
            state.user = null;
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
                state.user = null;
                state.isAuthenticated = false;
                state.error = null;
                state.userInfoError = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                // 即使登出失败，也清除本地状态
                state.credential = null;
                state.user = null;
                state.isAuthenticated = false;
                state.userInfoError = null;
            })

            // 用户信息获取处理
            .addCase(fetchUserInfo.pending, (state) => {
                state.userInfoLoading = true;
                state.userInfoError = null;
            })
            .addCase(fetchUserInfo.fulfilled, (state, action) => {
                state.userInfoLoading = false;
                state.user = action.payload;
                state.userInfoError = null;
            })
            .addCase(fetchUserInfo.rejected, (state, action) => {
                state.userInfoLoading = false;
                state.userInfoError = action.payload as string;
                // 获取用户信息失败时，不清除现有用户信息
            });
    }
});

export const { setCredential, setUser, clearUser, clearError, resetRegisterState, clearAuthState } = authSlice.actions;
export default authSlice.reducer;