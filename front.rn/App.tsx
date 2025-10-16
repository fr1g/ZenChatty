import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { createStaticNavigation, } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import "./v3.css";
import "./v3.output.css";
import HomePage from './pages/HomePage';

const mainRoute = {
    initialRouteName: 'Home',
    screens: {
        Home: HomePage
    }
}

const MainEntry = createStaticNavigation(createDrawerNavigator(mainRoute));

export default function App() {
    return <MainEntry />;
}

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff',
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
// });
