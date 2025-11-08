import { createStaticNavigation, ParamListBase, RouteProp, StaticParamList } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationOptions, DrawerNavigationProp } from '@react-navigation/drawer';
import Overview from '../screens/overview';
import Details from '../screens/details';
import { BackButton } from '../components/BackButton';
import MainDrawerHeader from '../components/MainDrawerHeader';

// tag MainNavigationEntrance

export const headerBar = ({ navigation, route, options }:
    {
        navigation: DrawerNavigationProp<ParamListBase, string, undefined>,
        route: RouteProp<ParamListBase>,
        options: DrawerNavigationOptions
    }) => <MainDrawerHeader
        navigation={navigation}
        route={route}
        options={options}
    />

export const screenOpt: DrawerNavigationOptions = {
    drawerPosition: 'right',
    header: headerBar,
}

const Navigator = createDrawerNavigator({
    screenOptions: screenOpt,
    screens: {
        Overview: {
            screen: Overview,
        },
        Details: {
            screen: Details,
            // options: ({ navigation }) => ({
            //     headerLeft: () => <BackButton onPress={navigation.goBack} />,
            // }),
        },
    },
});

type RootNavigatorParamList = StaticParamList<typeof Navigator>;

declare global {
    namespace ReactNavigation {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface RootParamList extends RootNavigatorParamList { }
    }
}

const Drawer = Navigator; //createStaticNavigation(Navigator);
export default Drawer;
