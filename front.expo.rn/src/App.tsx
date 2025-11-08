import './global.css';

import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useMemo, useState } from 'react';

import 'react-native-gesture-handler';

import Drawer, { screenOpt } from './navigation';
import Overview from './screens/overview';
import MainDrawerContainer from './components/MainDrawerContainer';

function DefaultView() {
    return <NavigationContainer >
        <Drawer.Navigator screenOptions={screenOpt} drawerContent={(props) => <MainDrawerContainer {...props} />}>
            <Drawer.Screen name='index' component={Overview} />
        </Drawer.Navigator>
    </NavigationContainer>;
}


export default function App() {
    const [savedCredential, setSavedCredential] = useState(null);

    const colorScheme = useColorScheme();
    const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

    return savedCredential !== null ? <></> : <DefaultView />; // dev: !==

}
