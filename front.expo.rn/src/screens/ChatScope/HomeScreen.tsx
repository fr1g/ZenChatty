import { useNavigation } from "@react-navigation/native";
import { JumpContext } from "navigation/MainNavigator";
import { ScopeContext } from "navigation/MainNavigator";
import { ChatScopeParams } from "navigation/types";
import { useContext, useEffect } from "react";
import { View, Text, Button } from "react-native";

export default function HomeScreen({ route, navigation }: any){
    
    const scopeChange = useContext(ScopeContext);
    const updater = useContext(JumpContext);
    useEffect(() => {

    }, [updater]);

    const props = route.params as ChatScopeParams || {};

    function back(){
        scopeChange.change("main");
    }

    function gotoConversation(){

    }

    return <View>
        <Text>home:: {JSON.stringify(updater?.param)} {'\n'} {updater == null}
            {(updater?.param as ChatScopeParams).whereFrom}
            {(updater?.param as ChatScopeParams).goingTo}
        </Text>
        <Button onPress={back} title="Back to Overview" />
        <Button onPress={gotoConversation} title="Go to Conversation" />
    </View>
}