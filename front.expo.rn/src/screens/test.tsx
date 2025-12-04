import { useNavigation } from "@react-navigation/native";
import { JumpContext, ScopeContext } from "navigation/MainNavigator";
import { useContext } from "react";
import { View, Text, Button } from "react-native";
import type { ChatScopeParams, RootStackParamList } from "navigation/types";
import type { StackNavigationProp } from "@react-navigation/stack";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function Retest() {
    const navigation = useNavigation<NavigationProp>();
    const scopeChange = useContext(ScopeContext);
    const updater = useContext(JumpContext);

    function go() {
        let prep = {
            whereFrom: "test_page",
            goingTo: "conversation"
        } as ChatScopeParams;
        updater.setParam(prep);

        scopeChange.change("chat");

        // navigation.navigate("cs_home", prep);

    }

    return <View>
        <Button onPress={go} title="goto chatscope main" />
    </View>
}