import { useNavigation } from "@react-navigation/native";
import { ScopeContext } from "navigation/MainNavigator";
import { useContext } from "react";
import { View, Text, Button } from "react-native";

export default function Retest(){
    const navigation = useNavigation();
    const scopeChange = useContext(ScopeContext);

    function go(){
        scopeChange.change("chat");
        navigation.navigate("cs_home" as never);
    }
    return <View>
        <Button onPress={go} title="goto chatscope main" />
    </View>
}