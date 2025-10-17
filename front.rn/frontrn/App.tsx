/* eslint-disable @typescript-eslint/no-unused-vars */

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
