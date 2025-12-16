import { useState } from "react";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'; import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/StoreProvider";
import { Credential } from "zen-core-chatty-ts";
import Login from "../screens/Unauthorized/Login";
import Register from "../screens/Unauthorized/Register";
import { NavigationContainer } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Navigator = createMaterialTopTabNavigator();

export default function UnauthorizedView({ theme }: { theme: ReactNavigation.Theme }) {
    const dispatch = useDispatch();
    const inset = useSafeAreaInsets();
    let insetHeight = inset.top;
    
    const doLogin = (afterJob: () => void, credential: Credential) => {
        console.log('doLogin', credential)
        // Should call Redux action to update auth state here
        // dispatch(loginSuccess(credential));
        afterJob();
    }

    return <NavigationContainer theme={theme}>
        <Navigator.Navigator className="bg-transparent" initialRouteName="Login" style={{ marginTop: insetHeight }} >
            <Navigator.Screen name='Login'>
                {() => <Login  />}
            </Navigator.Screen>
            <Navigator.Screen name='Register'>
                {() => <Register  />}
            </Navigator.Screen>
        </Navigator.Navigator>
    </NavigationContainer>
}