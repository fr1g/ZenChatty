import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from 'screens/ChatScope/HomeScreen';
import { ChatScopeParamInitState, ChatScopeParamList, ChatScopeParams } from './types';
import { createContext, useState, useContext } from 'react';
import Conversation from 'screens/ChatScope/Conversation';
import { JumpContext } from './MainNavigator';

// const ChatScopeNavigator = createStackNavigator<ChatScopeParamList>();
const ChatScopeNavigator = createStackNavigator();

export default function ChatScopeViews() {
    const updater = useContext(JumpContext);
    const params = updater?.param as ChatScopeParams;
    
    // Determine initial route based on params
    const initialRouteName = params?.goingTo === 'conversation' ? 'conversation' : 'cs_home';

    return <ChatScopeNavigator.Navigator initialRouteName={initialRouteName}>
            <ChatScopeNavigator.Screen
                name='cs_home'
                component={HomeScreen}
            />
            <ChatScopeNavigator.Screen 
                name='conversation' 
                component={Conversation}
                options={{ headerShown: false }}
            />
        </ChatScopeNavigator.Navigator>
}

/**ChatScope Behaviour
 * 
 * 
 */