import { useNavigation } from "@react-navigation/native";
import { ChatScopeProps } from "navigation/ChatScope";
import { ScopeContext } from "navigation/MainNavigator";
import { useContext } from "react";
import { View, Text, Button } from "react-native";

export default function ({props} : {props: ChatScopeProps}){
    const navigation = useNavigation();
    const scopeChange = useContext(ScopeContext);

    function back(){
        scopeChange.change("main");
        props.whereFrom ? navigation.navigate(props.whereFrom as never) : navigation.goBack();
    }

    return <View>
        <Text>txtn</Text>
        <Button onPress={back} title="Back to Overview" />
    </View>
}