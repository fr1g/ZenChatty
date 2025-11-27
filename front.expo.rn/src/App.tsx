import './global.css';

import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import 'react-native-gesture-handler';

import { Credential } from 'zen-core-chatty-ts';
import DefaultView from './navigation/MainNavigator';
import UnauthorizedView from './navigation/Unauthorized';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, store, RootState } from './redux/StoreProvider';

// 保持向后兼容的上下文
export const LoggedInUserInstance =
    createContext<[null | Credential, ((user: Credential | null) => void)]>([null, () => console.log("NULL CALL")]);

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
    const isAuthenticated = !!authState.credential;

    useEffect(() => {
        console.log('Authentication state changed:', {
            isAuthenticated,
            credential: authState.credential,
            loading: authState.loading,
            error: authState.error
        });
    }, [isAuthenticated, authState]);

    return (
        <SafeAreaProvider>
            <LoggedInUserInstance.Provider value={[
                isAuthenticated ? authState.credential : null,
                () => console.log("Use Redux actions instead of this context setter")
            ]}>
                {
                    isAuthenticated ?
                        <DefaultView theme={theme} /> :
                        <UnauthorizedView theme={theme} />
                }
            </LoggedInUserInstance.Provider>
        </SafeAreaProvider>
    );
}
