import { useNavigation } from "@react-navigation/native";
import { JumpContext } from "navigation/MainNavigator";
import { ScopeContext } from "navigation/MainNavigator";
import { ChatScopeParams } from "navigation/types";
import { useContext, useEffect } from "react";
import { View, Text, Button } from "react-native";

export default function HomeScreen({ route, navigation }: any){
    
    const scopeChange = useContext(ScopeContext);
    const updater = useContext(JumpContext);
    
    // Listen for parameter changes, auto navigate to target screen
    useEffect(() => {
        const params = updater?.param as ChatScopeParams;
        
        // If there's a navigation target, auto navigate
        if (params?.goingTo === 'conversation' && params?.params?.targetQueryId) {
            // Navigate to chat screen immediately
            navigation.navigate('conversation');
        }
    }, [updater?.param]);

    const props = route.params as ChatScopeParams || {};

    function back(){
        scopeChange.change("main");
    }

    function gotoConversation(){
        navigation.navigate('conversation');
    }

    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ marginBottom: 20 }}>ChatScope Home</Text>
        <Text style={{ marginBottom: 10, fontSize: 12, color: '#666' }}>
            Params: {JSON.stringify(updater?.param?.params)}
        </Text>
        <Text style={{ marginBottom: 20, fontSize: 12, color: '#666' }}>
            Target: {(updater?.param as ChatScopeParams)?.goingTo}
        </Text>
        <Button onPress={back} title="Back to Overview" />
        <Button onPress={gotoConversation} title="Go to Conversation" />
    </View>
}