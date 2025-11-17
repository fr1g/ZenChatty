import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from './../components/ScreenContent';

import { Alert, FlatList, StyleSheet, View, Text } from 'react-native';

import { Button } from '../components/Button';
import Contact from './../class/Contact';
import User from '../class/User';
import Chat from '../class/Chat';
import { EChatStatus } from '../class/enums/EnumChatRelated';
import { MockContactBook } from '../class/shared/MockData';

export default function Overview() {
  const navigation = useNavigation();

  const openedChats: Contact[] = MockContactBook.recentlyChats;

  return <FlatList data={openedChats} renderItem={({ item }) => (
    <View>
      <Text>{item.displayName}</Text>
    </View>
  )} /> 
}



export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
