import { View, Text, Button, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Route } from '@react-navigation/native';
import { getHeaderTitle, HeaderTitleProps, SafeAreaProviderCompat } from '@react-navigation/elements';
import { ReactNode, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentUserGet, useUserInfo } from 'hooks/useCredential';
import { DefaultAvatarUrl, ImageActs, ProfileImageUrlPair, RootState, User } from 'zen-core-chatty-ts';

interface RouteOptionsType { title?: string | undefined; headerTitle?: string | ((props: HeaderTitleProps) => ReactNode) | undefined; }

export default function
    MainDrawerHeader(
        { navigation, route, options }:
            { navigation: unknown | any, route: Route<any, any>, options: RouteOptionsType }
    ) {
    const dispatch = useDispatch();
    const authState = useSelector((state: RootState) => state.auth);
    const currentGetter = useCurrentUserGet(authState, dispatch);
    const [user, setUser] = useState<User | null>(null);
    const [imagePair, setImagePair] = useState<ProfileImageUrlPair | null>(null);

    useEffect(() => {
        for (let i = 0; i < 3; i++) {
            try {
                currentGetter().then((user) => {
                    setUser(user);
                    setImagePair(ImageActs.getUserProfileImagePairAsUrl(user!));
                }).catch((error) => {
                    if (i == 2) throw error;
                    // else continue;
                });
                break;
            } catch (error) {
                console.error('获取用户IMG失败:', error);
            }
        }

    }, []);

    let title = getHeaderTitle(options, route.name);
    let inset = useSafeAreaInsets();
    let dir: 'right' | 'left' = 'right';

    const statusBarHeight = inset.top;

    // return <SafeAreaProviderCompat> 
    // image:
    /*
     *  onError={(error) => console.log('图片加载失败:', error)} onLoad={() => console.log('图片加载成功')}
    */
    return <View style={{ paddingTop: statusBarHeight }} className='bg-slate-500'>
        <View className={`flex px-3 pb-1 w-full gap-3 h-20 ${(dir === 'right') ? 'flex-row-reverse' : 'flex-row'}`} >

            <TouchableOpacity style={{ zIndex: 99999 }} className='fixed right-0 top-0 ' onPress={() => navigation.toggleDrawer()}>
                <Image
                    source={{ uri: imagePair?.avatar ?? DefaultAvatarUrl }}
                    style={{ width: 48, height: 48, borderRadius: 100, marginVertical: 'auto' }}
                />
            </TouchableOpacity>

            <Text className='text-zinc-50 px-1 text-xl my-auto pt-1 align-middle'>
                {
                    title == "index" ? `Welcome, ${user?.customId}!` : title
                }
            </Text>

        </View>
    </View>
    // </SafeAreaProviderCompat>
}