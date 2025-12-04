import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from 'screens/ChatScope/HomeScreen';
import { ChatScopeParamInitState, ChatScopeParamList, ChatScopeParams } from './types';
import { createContext, useState } from 'react';
import Conversation from 'screens/ChatScope/Conversation';

// const ChatScopeNavigator = createStackNavigator<ChatScopeParamList>();
const ChatScopeNavigator = createStackNavigator();

export default function ChatScopeViews() {

    return <ChatScopeNavigator.Navigator>
            <ChatScopeNavigator.Screen
                name='cs_home'
                component={HomeScreen}
            />
            <ChatScopeNavigator.Screen name='conversation' component={Conversation} />
        </ChatScopeNavigator.Navigator>
}

/**ChatScope Behaviour
 * 
 * 
 */