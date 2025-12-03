import { NavigationContainer, ParamListBase, RouteProp, StaticParamList } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationOptions, DrawerNavigationProp } from '@react-navigation/drawer';
import Overview from '../screens/overview';
import UserSearchScreen from '../screens/UserSearchScreen';
import MainDrawerHeader from '../components/MainDrawerHeader';
import MainDrawerContainer from '../components/MainDrawerContainer';
import { createContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import ChatScopeViews from './ChatScope';
import Retest from 'screens/test';

// tag MainNavigationEntrance

const headerBar = ({ navigation, route, options }:
    {
        navigation: DrawerNavigationProp<ParamListBase, string, undefined>,
        route: RouteProp<ParamListBase>,
        options: DrawerNavigationOptions
    }) => <MainDrawerHeader
        navigation={navigation}
        route={route}
        options={options}
    />

const screenOpt: DrawerNavigationOptions = {
    drawerPosition: 'right',
    header: headerBar,
}

const Drawer = createDrawerNavigator();

export const ScopeContext = createContext<{ scope: "main" | "chat", change: Function }>({ scope: "main", change: () => "scope not ready" });

export default function DefaultView({ theme }: { theme: ReactNavigation.Theme }) {

    const [screenOptions, setScreenOptions] = useState(screenOpt);
    const [scope, setScope] = useState<"main" | "chat">("main");

    useEffect(() => {
        // ...
        let dir: "left" | "right" = "right"
        setScreenOptions(_ => {
            _.drawerPosition = dir;
            return { ..._ };
        })
    }, []);

    return <ScopeContext.Provider value={{ scope: scope, change: setScope }}>
        <NavigationContainer theme={theme} >
            {
                scope == "main" ?

                    <Drawer.Navigator
                        screenOptions={screenOptions}
                        drawerContent={(props) => <MainDrawerContainer {...props} />}>
                        <Drawer.Screen name='index' component={Overview} />
                        <Drawer.Screen name='ex' component={Retest} />
                        <Drawer.Screen name='user-search' component={UserSearchScreen} options={{ title: 'Add Friend' }} />
                    </Drawer.Navigator>
                    :
                    <ChatScopeViews />
                // scopping into two different stages
            }
        </NavigationContainer>
    </ScopeContext.Provider>;
}
// I SINCERELY SUPPOSE THAT REGULAR MOBILE APPS SHOULD BE REPLACED BY PWA WEB APPS. WEB ALWAYS HAVE EFFICIENCY!!!!!!!!!