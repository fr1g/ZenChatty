import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from './../components/ScreenContent';

import { Alert, FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import { Button } from '../components/Button';
import Contact from './../class/Contact';
import User from '../class/User';
import Chat from '../class/Chat';
import { EChatStatus } from '../class/enums/EnumChatRelated';
import { MockContactBook } from '../class/shared/MockData';
import Avatar from '../components/Avatar';
import { getImgByLocator } from '../class/helpers/FileRequest';
import ShortRecentMsgView from '../components/ShortRecentMsgView';

export default async function Overview() {
  // const navigation = useNavigation();

  const openedChats: Contact[] = MockContactBook.recentlyChats;

  return <FlatList data={openedChats} renderItem={({ item }) => (
    <TouchableOpacity className='h-20 flex-row items-center border-b border-b-zinc-300 dark:border-b-zinc-700'>
      <Avatar locator={item.avatarFileLocator ?? ''} />
      <View className='grow '>
        <Text className='text-xl' >{item.displayName}</Text>
        <ShortRecentMsgView chat={item.object} />
      </View>
    </TouchableOpacity>
  )} />
}



export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
