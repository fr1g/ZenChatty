// This file is a mess with wiring everywhere
import './global.css';

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Alert, useColorScheme } from 'react-native';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import 'react-native-gesture-handler';

import {
    BasicResponse,
    ClientInitObject,
    CreateZenCoreClient,
    ZenCoreClient,
    Tools,
    User,
    setUser,
    setCredential,
    updateRecentContact,
    updateContact,
    addNewMessage,
    updateUnreadCount
} from 'zen-core-chatty-ts';
import SignalRClient from 'zen-core-chatty-ts/signalr-client';
import DefaultView from './navigation/MainNavigator';
import UnauthorizedView from './navigation/Unauthorized';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, RootState } from './redux/StoreProvider';
import { SQLiteStorageAdapter } from './database/SQLiteStorageAdapter';
import { LogoutHelper } from './class/helpers/LogoutHelper';
import { DefaultConfig } from 'ZenClient.config';

// SignalR client context
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

// SignalR connection management function
export const initializeSignalR = async (
    clientConfig: ClientInitObject,
    signalRClient: SignalRClient,
    dispatch: Function
): Promise<void> => {
    try {
        console.log('🚀 [RN SignalR] ========== Starting SignalR initialization ==========');

        // Set access token
        if (clientConfig.userToken) {
            signalRClient.setAccessToken(clientConfig.userToken);
            console.log('✅ [RN SignalR] Token set:', {
                tokenLength: clientConfig.userToken.length,
                tokenPreview: clientConfig.userToken.substring(0, 50) + '...'
            });
        } else {
            console.error('❌ [RN SignalR] Token does not exist!');
        }

        // Debug info: show connection config
        console.log('📋 [RN SignalR] Connection config:', {
            baseURL: clientConfig.baseURL,
            port: clientConfig.port,
            fullURL: `${clientConfig.baseURL}:${clientConfig.port}`,
            hasToken: !!clientConfig.userToken,
            tokenLength: clientConfig.userToken?.length || 0
        });

        // Establish connection
        console.log('⏳ [RN SignalR] Establishing connection...');
        await signalRClient.connect();
        console.log('✅ [RN SignalR] Connection successful! State:', signalRClient.getConnectionState());

        console.log('📝 [RN SignalR] Setting up event handlers...');

        // Set up event handling - using IncomeMessage event
        signalRClient.onIncomeMessage = (data) => {
            console.log('📨 [RN SignalR] ========== Received IncomeMessage ==========');
            console.log('📨 [RN SignalR] Raw data:', JSON.stringify(data, null, 2));

            // Update Redux state: add new message
            // Note: SignalR SDK returns camelCase format (data.message)
            const message = data.message;
            if (message) {
                console.log('✅ [RN SignalR] Message parsed successfully:', {
                    traceId: message.traceId,
                    chatId: data.chatUniqueMark,
                    senderId: message.senderId,
                    content: message.content?.substring(0, 50),
                    timestamp: message.sentTimestamp
                });
                console.log('⏳ [RN SignalR] Dispatching to Redux: addNewMessage');
                dispatch(addNewMessage(message));
                console.log('✅ [RN SignalR] Message added to Redux');
            } else {
                console.error('❌ [RN SignalR] Message data incomplete:', data);
            }
            console.log('📨 [RN SignalR] ========== IncomeMessage processing complete ==========');
        };

        // Listen for message update events (recall, edit, etc.)
        signalRClient.onPatchMessage = (data) => {
            console.log('📝 [RN SignalR] ========== Received PatchMessage ==========');
            console.log('📝 [RN SignalR] Data:', JSON.stringify(data, null, 2));

            const updatedMessage = data.updatedMessage;
            if (updatedMessage) {
                console.log('✅ [RN SignalR] Message update:', {
                    traceId: updatedMessage.traceId,
                    updateType: data.updateType
                });
                dispatch(addNewMessage(updatedMessage)); // Redux will replace message with same traceId
            }
            console.log('📝 [RN SignalR] ========== PatchMessage processing complete ==========');
        };

        // Keep old callback for compatibility
        signalRClient.onContactAndMessageUpdated = (contact, message, totalUnreadCount) => {
            console.log('📬 [RN SignalR] Received old format message:', {
                contactId: contact?.contactId,
                messageId: message?.traceId,
                totalUnreadCount
            });
            dispatch(addNewMessage(message));
            dispatch(updateRecentContact(contact));
        };

        signalRClient.onUnreadCountUpdated = (contactId, unreadCount) => {
            console.log('🔔 [RN SignalR] Unread count updated:', { contactId, unreadCount });
            dispatch(updateUnreadCount({ contactId, unreadCount }));
        };

        signalRClient.onContactUpdated = (contact) => {
            console.log('👤 [RN SignalR] Contact updated:', contact?.contactId);
            dispatch(updateContact(contact));
        };

        // Note: onUpdateRecents is handled in overview.tsx for real-time home screen updates
        // Do NOT set it here to avoid overwriting the overview.tsx handler

        signalRClient.onReconnecting = (error) => {
            console.warn('🔄 [RN SignalR] Reconnecting...', error?.message);
        };

        signalRClient.onReconnected = (connectionId) => {
            console.log('✅ [RN SignalR] Reconnection successful! ConnectionId:', connectionId);
        };

        signalRClient.onConnectionClosed = (error) => {
            console.warn('🔴 [RN SignalR] Connection closed', error?.message);
        };

        console.log('✅ [RN SignalR] ========== SignalR initialization complete ==========');
        console.log('✅ [RN SignalR] Current connection state:', signalRClient.getConnectionState());
    } catch (error) {
        console.error('❌ [RN SignalR] ========== Initialization failed ==========');
        console.error('❌ [RN SignalR] Error details:', {
            error,
            message: error instanceof Error ? error.message : String(error),
            baseURL: clientConfig.baseURL,
            port: clientConfig.port,
            hasToken: !!clientConfig.userToken,
            tokenLength: clientConfig.userToken?.length || 0,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};

// Disconnect SignalR connection
export const disconnectSignalR = async (signalRClient: SignalRClient): Promise<void> => {
    try {
        await signalRClient.disconnect();
        console.log('SignalR connection disconnected');
    } catch (error) {
        console.error('Failed to disconnect SignalR:', error);
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
    for (let i = 0; i < 3; i++) {
        try {
            userInfo = await client!.auth.getUserInfo();
            break;
        } catch (error) {
            console.warn('Failed to get user info:', error, i);
            possible = error as Error;
        }
    }
    if (userInfo === undefined) {

        if (possible && possible.message.toLowerCase().includes("token expired")) {

            await LogoutHelper.cleanupCredentialsOnly(guid, storageAdapter)
            Alert.alert("Login Expired", "you may need to re-login"); // todo standardize alert

        }
        else
            Alert.alert("Failed to get user info", possible?.message);
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

    // SignalR connection management
    useEffect(() => {
        if (isAuthenticated && clientConfig.userToken) {
            const problem = clientConfig.baseURL!.match(/:.[0-9]/g);
            console.warn(`Initiating SignalR. ccburl: ${clientConfig.baseURL} :: ${problem}`)
            let prepareHubHost = problem ?
                clientConfig.baseURL :
                `${clientConfig.baseURL}:${clientConfig.port}`;
            console.warn(prepareHubHost);
            const signalR = new SignalRClient(prepareHubHost!);
            setSignalRClient(signalR);

            initializeSignalR(clientConfig, signalR, dispatch).catch(error => {
                console.error('SignalR connection failed:', error);
            });

            return () => {
                disconnectSignalR(signalR).catch(error => {
                    console.error('Failed to disconnect SignalR:', error);
                });
            };
        } else {
            // User not authenticated, disconnect SignalR
            if (signalRClient) {
                disconnectSignalR(signalRClient).catch(error => {
                    console.error('Failed to disconnect SignalR:', error);
                });
                setSignalRClient(null);
            }
        }
    }, [isAuthenticated, clientConfig.userToken]);

    // Update SignalR connection when auth state changes
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

                console.log('=== Starting auth state restoration ===');

                console.log('Checking credentials table...');
                const credentials = await storageAdapter.getAllCredentials();
                console.log(`Credentials table count: ${credentials.length}`);

                if (credentials.length <= 0) {
                    console.log('No valid credentials, skipping restoration');
                    setIsLoading(false);
                    return;
                }

                if (credentials.length > 0) {
                    const credential = credentials[0];
                    const now = Date.now();

                    const expiresAt = credential.expires_at ? new Date(credential.expires_at).getTime() : 0;

                    console.log('Credential check:', {
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
                    if (!isValid) throw new Error("Invalid user token");
                    if (expiresAt > now) {
                        // Credentials valid, restore login state
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

                        console.log('Auth state restored from SQLite:', restoredCredential);
                    } else {
                        console.log('Cached credentials expired, attempting refresh with refresh token...');

                        const refreshTokenExpiresAt = credential.refresh_token_expires_at ? new Date(credential.refresh_token_expires_at).getTime() : 0;
                        if (refreshTokenExpiresAt > now) { // maybe useless, since always checks token on backend
                            try {
                                client = CreateZenCoreClient(ClientConfig);
                                const refreshRequest = {
                                    refreshToken: credential.refresh_token,
                                    deviceId: credential.using_device_id
                                };

                                console.log('Refreshing access token using refresh token...');
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

                                    console.log('Credentials refreshed successfully, auth state restored:', restoredCredential);
                                } else {
                                    console.log('Refresh token refresh failed, need to re-login');
                                }
                            } catch (error) {
                                console.error('Refresh token refresh failed:', error);
                                console.log('Need to re-login');
                            }
                        } else {
                            console.log('Refresh token also expired, need to re-login');
                        }
                    }
                } else {
                    console.log('No valid credentials found');
                }

                // might useless stuff
                const cachedUserInfo = await storageAdapter.getCachedCurrentUserInfo();
                if (cachedUserInfo) {
                    console.log('Found cached user info:', cachedUserInfo);
                } else {
                    console.log('No cached user info found');
                }
                // Should have thrown earlier if reaching here

            } catch (error) {
                console.error('Error on auth reconfigure OR setting current info of user:', error);

                try {
                    if ((error as Error).message.toLowerCase().includes('invalid')) {
                        Alert.alert("Log out", "Your status has expired.");
                        // Use utility method to clean up invalid credentials
                        await LogoutHelper.cleanupCredentialsOnly(guid, storageAdapter!);
                        console.log('Invalid credentials successfully cleared: ', guid);
                    }
                } catch (cleanupError) {
                    console.error('Failed to clear invalid credentials:', cleanupError);
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

    // Display loading state
    if (isLoading) {
        return (
            <SafeAreaProvider>
                {/* Can add loading indicator here */}
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