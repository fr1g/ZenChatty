import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { DrawerNavigationState, ParamListBase, StackActions } from "@react-navigation/native";
import { DrawerNavigationHelpers, DrawerDescriptorMap } from "node_modules/@react-navigation/drawer/lib/typescript/module/src/types";
import { View, StyleSheet, Text, Linking, Alert, ImageBackground } from "react-native";
import { useCredential, useUserInfo } from "../hooks/useCredential";
import { useSelector, useDispatch } from "react-redux";
import { RootState, User, logoutUser, Credential, ImageActs, ProfileImageUrlPair, DefaultAvatarUrl } from "zen-core-chatty-ts";
import { useEffect, useState } from "react";
import { SQLiteStorageAdapter } from "../database/SQLiteStorageAdapter";
import { ClientConfig } from "./../App";
import { LogoutHelper } from "../class/helpers/LogoutHelper";

type Props = {
    state: DrawerNavigationState<ParamListBase>;
    navigation: DrawerNavigationHelpers;
    descriptors: DrawerDescriptorMap;
}

export default function MainDrawerContainer(props: Props) {
    const user = useSelector((state: RootState) => state.auth.user);
    const credential = useSelector((state: RootState) => state.auth.credential);
    const dispatch = useDispatch();
    const [storageAdapter, setStorageAdapter] = useState(new SQLiteStorageAdapter());
    const [imagePair, setImagePair] = useState<ProfileImageUrlPair | null>(null);

    useEffect(() => {
        setImagePair(ImageActs.getUserProfileImagePairAsUrl(user!));
        console.log(user?.customId ?? "cannot get the info");
    }, [user]); 

    const handleLogout = async () => {
        Alert.alert(
            "Log Out?",
            "Are you sure you want to log out?",
            [
                {
                    text: "No",
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: async () => {
                        try {
                            if (credential) {
                                await storageAdapter.initialize();
                                // 调用退出登录action
                                await dispatch(logoutUser({
                                    credential,
                                    clientConfig: ClientConfig,
                                    storageMethod: async (credentialToClear: Credential, wipe: boolean) => {
                                        if (wipe) {
                                            // 使用工具方法清理用户数据
                                            await LogoutHelper.cleanupUserData(
                                                credentialToClear,
                                                storageAdapter,
                                                ClientConfig
                                            );
                                        }
                                    }
                                }) as any).unwrap();

                                // 导航回登录页面
                                props.navigation.dispatch(
                                    StackActions.replace('Unauthorized')
                                );
                            }
                        } catch (error) {
                            console.error('Failed: ', error);
                            Alert.alert('Error when logging out', 'Your credential will be safely cleaned up');
                            await storageAdapter.initialize();
                            await LogoutHelper.cleanupCredentialsOnly(user!.localId, storageAdapter)

                        }
                    }
                }
            ]
        );
    };

    return <DrawerContentScrollView {...props} className="border-4 border-rose-300" style={styles.drawerContainer}>
        {/* 自定义头部 */}
        <View className="shadow" style={styles.drawerHeaderBg} >
            <ImageBackground style={styles.drawerHeader} source={{ uri: (`${imagePair?.background == DefaultAvatarUrl ? imagePair?.background : imagePair?.background}`) }}>
            </ImageBackground>

            <Text style={styles.drawerHeaderText}>{user?.displayName || user?.customId}</Text>

        </View>
        <DrawerItemList {...props} />

        <View className="grow h-full"></View>
        <DrawerItem
            label="LogOut"
            onPress={handleLogout}
            labelStyle={{ color: '#ff4444' }}
        />

    </DrawerContentScrollView>
}

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        padding: 0,
        height: '100%'
    },
    drawerHeaderBg: {
        marginBottom: 8,
        borderRadius: 26,
        height: 128,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        opacity: 0.68,
        // borderColor: "#9e9e9e5e",
        // borderWidth: 3,
        overflow: 'hidden'
    },
    drawerHeader: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        height: 128,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',

    },
    drawerHeaderText: {
        fontSize: 18,
        position: 'absolute',
        zIndex: 2,

        fontWeight: 'bold',
    },
});