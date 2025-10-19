import './global.css';

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useMemo, useState } from 'react';

import 'react-native-gesture-handler';

import Navigation from './navigation';

export default function App() {
    const [savedCredential, setSavedCredential] = useState(null);

    const colorScheme = useColorScheme();
    const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

    return savedCredential !== null ? <></> : <Navigation theme={theme} />; // dev: !==

}
