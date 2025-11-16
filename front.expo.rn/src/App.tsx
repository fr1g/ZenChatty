import './global.css';

import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import 'react-native-gesture-handler';

import UserCredential from './class/UserCredential';
import DefaultView from './navigation/MainNavigator';
import UnauthorizedView from './navigation/Unauthorized';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export const LoggedInUserInstance = 
createContext<[null | UserCredential, ((user: UserCredential | null) => void)]>([null, () => console.log("NULL CALL")]);

export default function App() {
    const [savedCredential, setSavedCredential] = useState<null | UserCredential>(null);

    useEffect(() => {
        console.log('savedCredential', savedCredential);
    }, [savedCredential]);
    const colorScheme = useColorScheme();
    const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

    return <SafeAreaProvider>
        <LoggedInUserInstance.Provider value={[savedCredential, setSavedCredential]}>
            {
                savedCredential === null ?
                    <UnauthorizedView theme={theme} /> :
                    <DefaultView theme={theme} />
            }
        </LoggedInUserInstance.Provider>
    </SafeAreaProvider>; // dev: !==

}
