import { JumpContext } from 'navigation/MainNavigator';
import { ChatScopeParams } from 'navigation/types';
import { useContext } from 'react';
import { View, Text } from 'react-native';

export default function Conversation({ route, navigation }: any){
    const updater = useContext(JumpContext);

    return <View>
        <Text>Conversation: {JSON.stringify(updater?.param as ChatScopeParams)}</Text>
    </View>
}