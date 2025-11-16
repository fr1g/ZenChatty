import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { DrawerNavigationState, ParamListBase, StackActions } from "@react-navigation/native";
import { DrawerNavigationHelpers, DrawerDescriptorMap } from "node_modules/@react-navigation/drawer/lib/typescript/module/src/types";
import { View, StyleSheet, Text, Linking } from "react-native";

type Props = {
    state: DrawerNavigationState<ParamListBase>;
    navigation: DrawerNavigationHelpers;
    descriptors: DrawerDescriptorMap;
}

export default function MainDrawerContainer(props: Props) {


    return <DrawerContentScrollView {...props} style={styles.drawerContainer}>
        {/* 自定义头部 */}
        <View style={styles.drawerHeader}>
            <Text style={styles.drawerHeaderText}>我的应用</Text>
        </View>
        {/* 默认的抽屉导航项 */}
        <DrawerItemList {...props} />
        {/* 自定义的底部项 */}
        <DrawerItem
            label="帮助与反馈"
            onPress={() => Linking.openURL('https://mywebsite.com/help')}
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