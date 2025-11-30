import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { DrawerNavigationState, ParamListBase, StackActions } from "@react-navigation/native";
import { DrawerNavigationHelpers, DrawerDescriptorMap } from "node_modules/@react-navigation/drawer/lib/typescript/module/src/types";
import { View, StyleSheet, Text, Linking, Alert } from "react-native";
import { useCredential, useUserInfo } from "../hooks/useCredential";
import { useSelector, useDispatch } from "react-redux";
import { RootState, User, logoutUser, Credential } from "zen-core-chatty-ts";
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
    const [xuser, setUser] = useState<User | null>(null);
    const user = useSelector((state: RootState) => state.auth.user);
    const credential = useSelector((state: RootState) => state.auth.credential);
    const dispatch = useDispatch();
    const [storageAdapter, setStorageAdapter] = useState(new SQLiteStorageAdapter());
    
    useEffect(() => {
        setUser(user);
        console.log(user?.customId ?? "cannot get the info");
    }, [user]);

    // 退出登录处理函数
    const handleLogout = async () => {
        Alert.alert(
            "确认退出",
            "您确定要退出登录吗？",
            [
                {
                    text: "取消",
                    style: "cancel"
                },
                {
                    text: "确定",
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
                            console.error('退出登录失败:', error);
                            Alert.alert('Error when logging out', 'Your credential will be safely cleaned up');
                            await storageAdapter.initialize();
                            await LogoutHelper.cleanupCredentialsOnly(user!.localId, storageAdapter)

                        }
                    }
                }
            ]
        );
    };

    return <DrawerContentScrollView {...props} className="border-2 border-black" style={styles.drawerContainer}>
        {/* 自定义头部 */}
        <View style={styles.drawerHeader}>
            <Text style={styles.drawerHeaderText}>{user?.displayName || user?.customId}</Text>
        </View>
        {/* 默认的抽屉导航项 */}
        <DrawerItemList {...props} />
        {/* 自定义的底部项 */}
        <DrawerItem
            label="帮助与反馈"
            onPress={() => Linking.openURL('https://mywebsite.com/help')}
        />
        {/* 退出登录按钮 */}
        <View className="grow h-full"></View>
        <DrawerItem
            label="退出登录"
            onPress={handleLogout}
            labelStyle={{ color: '#ff4444' }}
        />

    </DrawerContentScrollView>
}

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        padding: 0,
    },
    drawerHeader: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    drawerHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});