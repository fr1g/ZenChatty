import './global.css';

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Alert, useColorScheme } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import 'react-native-gesture-handler';

import { BasicResponse, ClientInitObject, CreateZenCoreClient, ZenCoreClient, Tools, fetchUserInfo, User, setUser } from 'zen-core-chatty-ts';
import DefaultView from './navigation/MainNavigator';
import UnauthorizedView from './navigation/Unauthorized';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, RootState } from './redux/StoreProvider';
import { SQLiteStorageAdapter } from './database/SQLiteStorageAdapter';
import { setCredential } from 'zen-core-chatty-ts';

export let ClientConfig: ClientInitObject = {
    baseURL: 'http://rus.kami.su',
    port: 5637,
    userToken: null,
    timeout: 10000,
}

export default function App() {
    const colorScheme = useColorScheme();
    const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

    return (
        <StoreProvider>
            <AppContent theme={theme} />
        </StoreProvider>
    );
}

function AppContent({ theme }: { theme: any }) {
    // 使用 Redux 状态管理认证状态
    const authState = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = !!authState.credential;

    // 应用启动时从SQLite恢复认证状态
    useEffect(() => {
        const restoreAuthState = async () => {
            let guid = "";
            let client: ZenCoreClient;
            let storageAdapter: SQLiteStorageAdapter | null = null;
            try {
                storageAdapter = new SQLiteStorageAdapter();
                await storageAdapter.initialize();
                
                console.log('=== 开始恢复认证状态 ===');
                
                // 首先检查凭据表
                console.log('检查凭据表...');
                const credentials = await storageAdapter.getAllCredentials();
                console.log(`凭据表记录数: ${credentials.length}`);

                if(credentials.length <= 0){
                    console.log('没有有效凭据，跳过恢复');
                    setIsLoading(false);
                    return;
                }


                const checker = (CreateZenCoreClient(ClientConfig));
                checker.setAuthToken(credentials[0].access_token);
                
                if (credentials.length > 0) {
                    // 使用第一条有效的凭据（通常只有一个用户登录）
                    const credential = credentials[0];
                    
                    // 检查凭据是否过期
                    const now = Date.now();
                    const expiresAt = credential.expires_at ? new Date(credential.expires_at).getTime() : 0;
                    
                    console.log('凭据检查:', {
                        user_guid: credential.user_guid,
                        expires_at: credential.expires_at,
                        now: now,
                        expiresAt: expiresAt,
                        isValid: expiresAt > now
                    });

                    guid = credential.user_guid;
                    
                    let isValid = (await checker.auth.validateToken() as BasicResponse).success;
                    if (expiresAt > now && isValid) {
                        // 凭据有效，恢复登录状态
                        const restoredCredential = {
                            UserGuid: credential.user_guid,
                            UsingDeviceId: credential.using_device_id,
                            RefreshToken: credential.refresh_token,
                            AccessToken: credential.access_token,
                            RefreshTokenExpiresAtTimestamp: credential.refresh_token_expires_at, 
                            AccessTokenExpiresAtTimestamp: credential.expires_at
                        };
                        
                        // 设置Redux状态
                        dispatch(setCredential(restoredCredential));
                        
                        // 设置客户端认证令牌
                        ClientConfig.userToken = credential.access_token;
                        
                        console.log('认证状态已从SQLite恢复:', restoredCredential);
                    } else {
                        console.log('缓存的凭据已过期，尝试使用refresh token刷新...');
                        
                        // 检查refresh token是否也过期
                        const refreshTokenExpiresAt = credential.refresh_token_expires_at ? new Date(credential.refresh_token_expires_at).getTime() : 0;
                        if (refreshTokenExpiresAt > now) {
                            // refresh token仍然有效，尝试刷新access token
                            try {
                                client = CreateZenCoreClient(ClientConfig);
                                const refreshRequest = {
                                    refreshToken: credential.refresh_token,
                                    deviceId: credential.using_device_id
                                };
                                
                                console.log('正在使用refresh token刷新access token...');
                                const refreshResponse = await client.auth.refreshToken(refreshRequest);
                                
                                if (refreshResponse.accessToken) {
                                    // 刷新成功，更新凭据
                                    const newCredential = {
                                        user_guid: credential.user_guid,
                                        access_token: refreshResponse.accessToken,
                                        refresh_token: refreshResponse.refreshToken || credential.refresh_token,
                                        root_token: credential.root_token,
                                        using_device_id: credential.using_device_id,
                                        expires_at: refreshResponse.accessTokenExpiresAt ? Tools.dotnetDateParse(refreshResponse.accessTokenExpiresAt as never).getTime() : 0,
                                        refresh_token_expires_at: refreshResponse.refreshTokenExpiresAt ? Tools.dotnetDateParse(refreshResponse.refreshTokenExpiresAt as never).getTime() : 0
                                    };
                                    
                                    // 保存新的凭据到数据库
                                    await storageAdapter.saveCredential(newCredential);
                                    
                                    // 恢复登录状态
                                    const restoredCredential = {
                                        UserGuid: newCredential.user_guid,
                                        UsingDeviceId: newCredential.using_device_id,
                                        RefreshToken: newCredential.refresh_token,
                                        AccessToken: newCredential.access_token,
                                        RefreshTokenExpiresAtTimestamp: newCredential.refresh_token_expires_at, 
                                        AccessTokenExpiresAtTimestamp: newCredential.expires_at
                                    };
                                    
                                    dispatch(setCredential(restoredCredential));
                                    ClientConfig.userToken = newCredential.access_token;
                                    
                                    console.log('凭据刷新成功，认证状态已恢复:', restoredCredential);
                                } else {
                                    console.log('refresh token刷新失败，需要重新登录');
                                }
                            } catch (error) {
                                console.error('refresh token刷新失败:', error);
                                console.log('需要重新登录');
                            }
                        } else {
                            console.log('refresh token也已过期，需要重新登录');
                        }
                    }
                } else {
                    console.log('没有找到有效的凭据记录');
                }
                
                // might useless stuff
                const cachedUserInfo = await storageAdapter.getCachedCurrentUserInfo();
                if (cachedUserInfo) {
                    console.log('找到缓存的用户信息:', cachedUserInfo);
                } else {
                    console.log('没有找到缓存的用户信息');
                }

                client = CreateZenCoreClient(ClientConfig);
                // 早就你妈throw了能到这里怎么可能还是undefined我真他妈操了
                let userInfo: User = await client!.auth.getUserInfo();
                dispatch(setUser(userInfo));
                
            } catch (error) {
                console.error('Error on auth reconfigure OR setting current info of user:', error);
                
                // 恢复认证失败后，清除本地SQLite中保存的无效token
                try {
                    if ((error as Error).message.toLowerCase().includes('invalid')) {
                        Alert.alert("Log out", "Your status has expired.");
                        await storageAdapter!.deleteCredential(guid);
                        console.log('无效凭据已成功清除: ', guid);
                    }
                } catch (cleanupError) {
                    console.error('清除无效凭据失败:', cleanupError);
                }
                // 
            } finally {
                setIsLoading(false);
            }
        };

        restoreAuthState();
    }, [dispatch]);

    useEffect(() => {
        console.log('Authentication state changed:', {
            isAuthenticated,
            credential: authState.credential,
            loading: authState.isLoading,
            error: authState.error
        });
    }, [isAuthenticated, authState]);

    // 显示加载状态
    if (isLoading) {
        return (
            <SafeAreaProvider>
                {/* 可以添加加载指示器 */}
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            {
                isAuthenticated ?
                    <DefaultView theme={theme} /> :
                    <UnauthorizedView theme={theme} />
            }
        </SafeAreaProvider>
    );
}
