import { Alert, FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MockContactBook } from '../class/shared/MockData';
import { Contact, ImageActs } from 'zen-core-chatty-ts';
import ListItem, { ListItemProps } from 'components/ListItem';
import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';

export default async function Overview() {
    // const navigation = useNavigation();
    function tryGetShowingName(){}
    const [openedChats, setOpenedChats] = useState<Contact[]>([]);
    const transformContactItem = (contact: Contact) => {
        return {
            avatarUrl: ImageActs.getContactChatAvatarAsUrl(contact),
            title: contact.displayName ?? "something's wrong... with backend...",
            subtitle: "here to get latest message? how?",
            topBadge: `${contact.lastUnreadCount}`,
            CIA: contact.isPinned ? (<Feather name="map-pin" size={16} color="#007AFF" />) : undefined,
            cornerTip: contact.lastUsed,
            highlight: contact.hasVitalUnread
        } as ListItemProps;
    }
    const updateSorting = () => {
        setOpenedChats(contacts => {
            const sortedByLastUsed = [...contacts].sort((a, b) => {
                const timeA = new Date(a.lastUsed).getTime();
                const timeB = new Date(b.lastUsed).getTime();
                return timeB - timeA; 
            });
            
            return [...sortedByLastUsed.filter(contact => contact.isPinned), 
                    ...sortedByLastUsed.filter(contact => !contact.isPinned)];
        })
    }

    useEffect(() => {
        setOpenedChats(MockContactBook.recentlyChats);
    }, [])

    return <FlatList className='grow border-2 border-red-300 pb-5' data={openedChats} renderItem={({ item }) => (
        <ListItem item={transformContactItem(item)} />
    )} />
}


export const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
});