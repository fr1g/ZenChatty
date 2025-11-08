import { View, Text, Button, StyleProp, ViewStyle, TouchableOpacity, Image } from 'react-native';
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
    return <View style={{ paddingTop: statusBarHeight }} className={`flex w-full bg-slate-200 gap-3 h-20 ${(dir === 'right') ? 'flex-row-reverse' : 'flex-row'}`} >

        <TouchableOpacity style={{ zIndex: 99999 }} className='fixed right-0 top-0 border ' onPress={() => navigation.toggleDrawer()}>
            <Image source={require('../assets/default-1r1-placeholder.png')} className='w-12 h-12 my-auto rounded-full' />
        </TouchableOpacity>

        <Text className='text-red-300 border-2 text-xl h-full  align-middle'>{title}</Text>

    </View>
    // </SafeAreaProviderCompat>
}