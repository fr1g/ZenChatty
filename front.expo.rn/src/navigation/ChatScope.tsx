import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from 'screens/ChatScope/HomeScreen';

const ChatScopeNavigator = createStackNavigator();

export default function ChatScopeViews() {


    return <ChatScopeNavigator.Navigator>
        <ChatScopeNavigator.Screen name='cs_home' component={(props: ChatScopeProps) => <HomeScreen {...props} />} />
    </ChatScopeNavigator.Navigator>
}

export class ChatScopeProps {
    params: any; // actually used params, defined one by one as interface acceptable inside target component
    whereFrom?: string; // if undefined, should back to 

}
/**ChatScope Behaviour
 * 
 * 
 */