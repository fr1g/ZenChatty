import { NavigationContainer, ParamListBase, RouteProp, StaticParamList } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationOptions, DrawerNavigationProp } from '@react-navigation/drawer';
import Overview from '../screens/overview';
import Details from '../screens/details';
import MainDrawerHeader from '../components/MainDrawerHeader';
import MainDrawerContainer from '../components/MainDrawerContainer';
import { useEffect, useState } from 'react';

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

export default function DefaultView({ theme }: { theme: ReactNavigation.Theme }) {

    const [screenOptions, setScreenOptions] = useState(screenOpt);

    useEffect(() => {
        // ...
        let dir: "left" | "right" = "right"
        setScreenOptions(_ => {
            _.drawerPosition = dir;
            return { ..._ };
        })
    }, []);

    return <NavigationContainer theme={theme} >
        <Drawer.Navigator
            screenOptions={screenOptions}
            drawerContent={(props) => <MainDrawerContainer {...props} />}>
            <Drawer.Screen name='index' component={Overview} />
            <Drawer.Screen name='another' component={Details} />
        </Drawer.Navigator>
    </NavigationContainer>;
}
