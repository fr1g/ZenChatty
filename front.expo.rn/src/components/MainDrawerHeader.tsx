import { View, Text, Button, StyleProp, ViewStyle } from 'react-native';
import { Route } from '@react-navigation/native';
import { getHeaderTitle, HeaderTitleProps, SafeAreaProviderCompat } from '@react-navigation/elements';
import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RouteOptionsType { title?: string | undefined; headerTitle?: string | ((props: HeaderTitleProps) => ReactNode) | undefined; }

export default function
    MainDrawerHeader(
        { navigation, route, options }:
            { navigation: unknown | any, route: Route<any, any>, options: RouteOptionsType }
    ) {
    let title = getHeaderTitle(options, route.name);
    let inset = useSafeAreaInsets();
    let dir: 'right' | 'left' = 'right';

    const statusBarHeight = inset.top;

    // return <SafeAreaProviderCompat>
    return <View style={{ paddingTop: statusBarHeight }} className={`flex w-full ?h-full ${(dir === 'right') ? 'flex-row-reverse' : 'flex-row'}`} >

        <Button title="{ICO}" onPress={() => navigation.toggleDrawer()} />
        <Text className='text-red-300 border-2 border-black h-full  align-middle'>{title}</Text>

    </View>
    // </SafeAreaProviderCompat>
}