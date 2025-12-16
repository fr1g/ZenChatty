import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { DrawerNavigationState, ParamListBase } from "@react-navigation/native";
import { DrawerNavigationHelpers, DrawerDescriptorMap } from "node_modules/@react-navigation/drawer/lib/typescript/module/src/types";
import { View, StyleSheet, Text, Linking, Alert, ImageBackground } from "react-native";
import { useCredential, useUserInfo } from "../hooks/useCredential";
import { useSelector, useDispatch } from "react-redux";
import { RootState, User, logoutUser, Credential, ImageActs, ProfileImageUrlPair, DefaultAvatarUrl } from "zen-core-chatty-ts";
import { useContext, useEffect, useState } from "react";
import { SQLiteStorageAdapter } from "../database/SQLiteStorageAdapter";
import { ContextedClientConfig } from "./../App";
import { LogoutHelper } from "../class/helpers/LogoutHelper";

type Props = {
    state: DrawerNavigationState<ParamListBase>;
    navigation: DrawerNavigationHelpers;
    descriptors: DrawerDescriptorMap;
}

export default function MainDrawerContainer(props: Props) {
    const user = useSelector((state: RootState) => state.auth.user);
    const credential = useSelector((state: RootState) => state.auth.credential);
    const clientConfig = useContext(ContextedClientConfig);
    const dispatch = useDispatch();
    const [storageAdapter, setStorageAdapter] = useState(new SQLiteStorageAdapter());
    const [imagePair, setImagePair] = useState<ProfileImageUrlPair | null>(null);

    useEffect(() => {
        if (user)
            setImagePair(ImageActs.getUserProfileImagePairAsUrl(user!));
        console.log("AVTR set result:: ", user?.customId ?? "cannot get the info");
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
                                // Call logout action
                                await dispatch(logoutUser({
                                    credential,
                                    clientConfig: clientConfig,
                                    storageMethod: async (credentialToClear: Credential, wipe: boolean) => {
                                        if (wipe) {
                                            // Use utility method to clean up user data
                                            await LogoutHelper.cleanupUserData(
                                                credentialToClear,
                                                storageAdapter,
                                                clientConfig
                                            );
                                        }
                                    }
                                }) as any).unwrap();

                                // Navigation happens automatically via conditional rendering
                                // when credential is cleared from Redux state
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
        {/* Custom header */}
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