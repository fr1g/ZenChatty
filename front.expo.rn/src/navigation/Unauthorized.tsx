import { NavigationContainer } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Login from "../screens/Unauthorized/Login";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Register from "../screens/Unauthorized/Register";
import { useContext } from "react";
import { LoggedInUserInstance } from "../App";
import UserCredential from "../class/UserCredential";

const Navigator = createMaterialTopTabNavigator();

export default function UnauthorizedView({ theme }: { theme: ReactNavigation.Theme }) {
    const x = useContext(LoggedInUserInstance);
    const user = x[0];
    const setUser = x[1];
    
    const inset = useSafeAreaInsets();
    let insetHeight = inset.top;
    const doLogin = (afterJob: () => void, credential: UserCredential) => {
        console.log('doLogin', credential)
        afterJob();
        setUser(credential);
    } // uses credential, run login, and give back user object

    return <NavigationContainer theme={theme}>
        <Navigator.Navigator className="bg-transparent" initialRouteName="Login" style={{ marginTop: insetHeight }} >
            <Navigator.Screen name='Login'>
                {() => <Login doLogin={doLogin} />}
            </Navigator.Screen>
            <Navigator.Screen name='Register'>
                {() => <Register doLogin={doLogin} />}
            </Navigator.Screen>
        </Navigator.Navigator>
    </NavigationContainer>
}