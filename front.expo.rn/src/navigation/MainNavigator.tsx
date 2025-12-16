import { NavigationContainer, ParamListBase, RouteProp, StaticParamList } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationOptions, DrawerNavigationProp } from '@react-navigation/drawer';
import Overview from '../screens/overview';
import UserSearchScreen from '../screens/UserSearchScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import FriendsListScreen from '../screens/FriendsListScreen';
import ContactsScreen from '../screens/ContactsScreen';
import MainDrawerHeader from '../components/MainDrawerHeader';
import MainDrawerContainer from '../components/MainDrawerContainer';
import { createContext, useEffect, useState } from 'react';
import ChatScopeViews from './ChatScope';
import Retest from 'screens/test';
import { ChatScopeParams, ChatScopeParamInitState } from './types';

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

export type UpdateJumpObject = {
    param: ChatScopeParams,
    setParam: Function
}
export const ScopeContext = createContext<{ scope: "main" | "chat", change: Function }>({ scope: "main", change: () => "scope not ready" });
export const JumpContext = createContext<UpdateJumpObject>({ param: {}, setParam: () => "not ready" });

export default function DefaultView({ theme }: { theme: ReactNavigation.Theme }) {
    const [p, setP] = useState<ChatScopeParams>(ChatScopeParamInitState)

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

    useEffect(() => {
        console.warn("UPD")
    }, [p])

    return <ScopeContext.Provider value={{ scope: scope, change: setScope }}>
        <JumpContext.Provider value={{ param: p, setParam: setP } as UpdateJumpObject}>

            <NavigationContainer theme={theme} >
                {
                    scope == "main" ?
                        <Drawer.Navigator
                            screenOptions={screenOptions}
                            drawerContent={(props) => <MainDrawerContainer {...props} />}>
                            <Drawer.Screen name='index' component={Overview} options={{ title: 'Chats' }} />
                            <Drawer.Screen name='contacts' component={ContactsScreen} options={{ title: 'Contacts' }} />
                            {/* The following pages can be navigated from Contacts page, hidden from drawer to avoid duplication */}
                            <Drawer.Screen name='friends' component={FriendsListScreen} options={{ title: 'Friends', drawerItemStyle: { display: 'none' } }} />
                            <Drawer.Screen name='friend-requests' component={FriendRequestsScreen} options={{ title: 'Friend Requests', drawerItemStyle: { display: 'none' } }} />
                            <Drawer.Screen name='user-search' component={UserSearchScreen} options={{ title: 'Add Friend', drawerItemStyle: { display: 'none' } }} />
                            <Drawer.Screen name='ex' component={Retest} options={{ drawerItemStyle: { display: 'none' } }} />
                        </Drawer.Navigator>
                        :
                        <ChatScopeViews />
                    // scopping into two different stages
                }
            </NavigationContainer>
        </JumpContext.Provider>

    </ScopeContext.Provider>;
}
// I SINCERELY SUPPOSE THAT REGULAR MOBILE APPS SHOULD BE REPLACED BY PWA WEB APPS. WEB ALWAYS HAVE EFFICIENCY!!!!!!!!!