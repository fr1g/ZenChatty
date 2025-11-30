// 这个文件已经是一坨史山了我真他妈服了啊，到处都是飞线
import './global.css';

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Alert, useColorScheme } from 'react-native';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import 'react-native-gesture-handler';

import { BasicResponse, ClientInitObject, CreateZenCoreClient, ZenCoreClient, Tools, fetchUserInfo, User, setUser } from 'zen-core-chatty-ts';
import SignalRClient from 'zen-core-chatty-ts/signalr-client';
import DefaultView from './navigation/MainNavigator';
import UnauthorizedView from './navigation/Unauthorized';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, RootState } from './redux/StoreProvider';
import { SQLiteStorageAdapter } from './database/SQLiteStorageAdapter';
import { setCredential } from 'zen-core-chatty-ts';
import { LogoutHelper } from './class/helpers/LogoutHelper';
import { DefaultConfig } from 'ZenClient.config';

// SignalR客户端上下文
export const SignalRContext = createContext<SignalRClient | null>(null);

export let ClientConfig: ClientInitObject = DefaultConfig;

export const ContextedClientConfig = createContext<ClientInitObject>(ClientConfig);

export default function App() {
    const colorScheme = useColorScheme();
    const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

    return (
        <StoreProvider>
            <AppContent theme={theme} />
        </StoreProvider>
    );
}

// SignalR连接管理函数
export const initializeSignalR = async (
    clientConfig: ClientInitObject,
    signalRClient: SignalRClient
): Promise<void> => {
    try {
        // 设置访问令牌
        if (clientConfig.userToken) {
            signalRClient.setAccessToken(clientConfig.userToken);
        }

        // 建立连接
        await signalRClient.connect();
        
        // 设置事件处理
        signalRClient.onContactAndMessageUpdated = (contact, message, totalUnreadCount) => {
            console.log('收到实时消息更新:', { contact, message, totalUnreadCount });
            // 这里可以添加Redux状态更新逻辑
        };

        signalRClient.onUnreadCountUpdated = (contactId, unreadCount) => {
            console.log('未读计数更新:', { contactId, unreadCount });
            // 这里可以添加未读计数更新逻辑
        };

        signalRClient.onContactUpdated = (contact) => {
            console.log('联系人更新:', contact);
            // 这里可以添加联系人更新逻辑
        };

        signalRClient.onReconnecting = (error) => {
            console.log('SignalR重新连接中:', error);
        };

        signalRClient.onReconnected = (connectionId) => {
            console.log('SignalR重新连接成功:', connectionId);
        };

        signalRClient.onConnectionClosed = (error) => {
            console.log('SignalR连接关闭:', error);
        };

        console.log('SignalR连接初始化成功');
    } catch (error) {
        console.error('SignalR连接初始化失败:', {
            error,
            baseURL: clientConfig.baseURL,
            port: clientConfig.port,
            hasToken: !!clientConfig.userToken,
            tokenLength: clientConfig.userToken?.length || 0,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};

// 断开SignalR连接
export const disconnectSignalR = async (signalRClient: SignalRClient): Promise<void> => {
    try {
        await signalRClient.disconnect();
        console.log('SignalR连接已断开');
    } catch (error) {
        console.error('断开SignalR连接失败:', error);
    }
};

export const tryGetUserEssentials = async (
    token: string, 
    guid: string,
    clientConfig: ClientInitObject, 
    setClientConfig: Function,
    dispatch: Function,
    storageAdapter: SQLiteStorageAdapter
) => {
        setClientConfig((_: ClientInitObject) => {
            return {
                ..._,
                userToken: token,
            }
        });
        let client = CreateZenCoreClient({
            ...clientConfig,
            userToken: token,
        } as ClientInitObject);
        let userInfo: User | undefined = undefined, possible;
        for(let i = 0; i < 3; i++) {
            try {
                userInfo = await client!.auth.getUserInfo();
                break;
            } catch (error) {
                console.warn('Failed to get user info:', error, i);
                possible = error as Error;
            }
        }
        if(userInfo === undefined){
              
            if(possible && possible.message.toLowerCase().includes("token expired")){
                
                await LogoutHelper.cleanupCredentialsOnly(guid, storageAdapter)
                Alert.alert("Login Expired", "you may need to re-login"); // todo 标准化alert

            }
            else 
                Alert.alert("获取用户信息失败", possible?.message);
            throw new Error("error on getting user info");
        }
        console.log('cached user info: ', userInfo);
        dispatch(setUser(userInfo));
        // nextstep: if ran 
        return (await client.auth.validateToken() as BasicResponse).success;
    };

function AppContent({ theme }: { theme: any }) {
    const authState = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = !!authState.credential;

    const [clientConfig, setClientConfig] = useState<ClientInitObject>(ClientConfig);
    const [signalRClient, setSignalRClient] = useState<SignalRClient | null>(null);

    // SignalR连接管理
    useEffect(() => {
        if (isAuthenticated && clientConfig.userToken) {
            const signalR = new SignalRClient(clientConfig.baseURL!);
            setSignalRClient(signalR);

            initializeSignalR(clientConfig, signalR).catch(error => {
                console.error('SignalR连接失败:', error);
            });

            return () => {
                disconnectSignalR(signalR).catch(error => {
                    console.error('断开SignalR连接失败:', error);
                });
            };
        } else {
            // 用户未认证，断开SignalR连接
            if (signalRClient) {
                disconnectSignalR(signalRClient).catch(error => {
                    console.error('断开SignalR连接失败:', error);
                });
                setSignalRClient(null);
            }
        }
    }, [isAuthenticated, clientConfig.userToken]);

    // 认证状态变化时更新SignalR连接
    useEffect(() => {
        if (signalRClient && clientConfig.userToken) {
            signalRClient.setAccessToken(clientConfig.userToken);
        }
    }, [clientConfig.userToken, signalRClient]);

    useEffect(() => {
        const restoreAuthState = async () => {
            let guid = "";
            let client: ZenCoreClient;
            let storageAdapter: SQLiteStorageAdapter | null = null;
            try {
                storageAdapter = new SQLiteStorageAdapter();
                await storageAdapter.initialize();

                console.log('=== 开始恢复认证状态 ===');

                console.log('检查凭据表...');
                const credentials = await storageAdapter.getAllCredentials();
                console.log(`凭据表记录数: ${credentials.length}`);

                if (credentials.length <= 0) {
                    console.log('没有有效凭据，跳过恢复');
                    setIsLoading(false);
                    return;
                }

                if (credentials.length > 0) {
                    const credential = credentials[0];
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
                    let isValid = await tryGetUserEssentials(
                        credential.access_token,
                        credential.user_guid,
                        clientConfig,
                        setClientConfig,
                        dispatch,
                        storageAdapter
                    );
                    if(!isValid) throw new Error("Invalid user token");
                    if (expiresAt > now) {
                        // 凭据有效，恢复登录状态
                        const restoredCredential = {
                            UserGuid: credential.user_guid,
                            UsingDeviceId: credential.using_device_id,
                            RefreshToken: credential.refresh_token,
                            AccessToken: credential.access_token,
                            RefreshTokenExpiresAtTimestamp: credential.refresh_token_expires_at,
                            AccessTokenExpiresAtTimestamp: credential.expires_at
                        };
                        dispatch(setCredential(restoredCredential));

                        // whatever, let it be.
                        ClientConfig.userToken = credential.access_token;

                        console.log('认证状态已从SQLite恢复:', restoredCredential);
                    } else {
                        console.log('缓存的凭据已过期，尝试使用refresh token刷新...');

                        const refreshTokenExpiresAt = credential.refresh_token_expires_at ? new Date(credential.refresh_token_expires_at).getTime() : 0;
                        if (refreshTokenExpiresAt > now) { // maybe useless, since always checks token on backend
                            try {
                                client = CreateZenCoreClient(ClientConfig);
                                const refreshRequest = {
                                    refreshToken: credential.refresh_token,
                                    deviceId: credential.using_device_id
                                };

                                console.log('正在使用refresh token刷新access token...');
                                const refreshResponse = await client.auth.refreshToken(refreshRequest);

                                if (refreshResponse.accessToken) {
                                    const newCredential = {
                                        user_guid: credential.user_guid,
                                        access_token: refreshResponse.accessToken,
                                        refresh_token: refreshResponse.refreshToken || credential.refresh_token,
                                        root_token: credential.root_token,
                                        using_device_id: credential.using_device_id,
                                        expires_at: refreshResponse.accessTokenExpiresAt ? Tools.dotnetDateParse(refreshResponse.accessTokenExpiresAt as never).getTime() : 0,
                                        refresh_token_expires_at: refreshResponse.refreshTokenExpiresAt ? Tools.dotnetDateParse(refreshResponse.refreshTokenExpiresAt as never).getTime() : 0
                                    };

                                    await storageAdapter.saveCredential(newCredential);

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
                // 早就你妈throw了能到这里不可能还是undefined我真他妈操了

            } catch (error) {
                console.error('Error on auth reconfigure OR setting current info of user:', error);

                try {
                    if ((error as Error).message.toLowerCase().includes('invalid')) {
                        Alert.alert("Log out", "Your status has expired.");
                        // 使用工具方法清理无效凭据
                        await LogoutHelper.cleanupCredentialsOnly(guid, storageAdapter!);
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
            <ContextedClientConfig.Provider value={clientConfig}>
                <SignalRContext.Provider value={signalRClient}>
                    {
                        isAuthenticated ?
                            <DefaultView theme={theme} /> :
                            <UnauthorizedView theme={theme} />
                    }
                </SignalRContext.Provider>
            </ContextedClientConfig.Provider>
        </SafeAreaProvider>
    );
}