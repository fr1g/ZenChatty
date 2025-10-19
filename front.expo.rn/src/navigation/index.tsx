import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Overview from '../screens/overview';
import Details from '../screens/details';
import { BackButton } from '../components/BackButton';
import MainDrawerHeader from '../components/MainDrawerHeader';

// tag MainNavigationEntrance

const Navigator = createDrawerNavigator({
    screenOptions: {
        drawerPosition: 'right',
        header: ({ navigation, route, options }) =>
            <MainDrawerHeader
                navigation={navigation}
                route={route}
                options={options}
            />,

    },
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

const Navigation = createStaticNavigation(Navigator);
export default Navigation;
