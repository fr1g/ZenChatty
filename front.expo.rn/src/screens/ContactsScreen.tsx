import React, { useEffect, useState, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
    ActionSheetIOS,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CreateZenCoreClient, Contact } from 'zen-core-chatty-ts';
import { useCredential } from 'hooks/useCredential';
import { ContextedClientConfig } from 'App';
import { useSelector } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { JumpContext, ScopeContext } from 'navigation/MainNavigator';
import { ChatScopeParams } from 'navigation/types';

interface FriendItem {
    contact: Contact;
    displayName: string;
    avatarUrl?: string;
    objectId?: string; // Friend's user ID
}

// WeChat style function entry item
interface FunctionEntry {
    id: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    title: string;
    badge?: number;
    onPress: () => void;
}

export default function ContactsScreen({ navigation }: any) {
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const credential = useCredential();
    const clientConfig = useContext(ContextedClientConfig);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const updater = useContext(JumpContext);
    const scopeChange = useContext(ScopeContext);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!credential?.AccessToken) return;
        
        setLoading(true);
        try {
            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential.AccessToken
            });

            // Load friends list
            const friendContacts = await client.contact.getFriends();
            const friendItems: FriendItem[] = friendContacts.map(contact => ({
                contact,
                displayName: contact.displayName || 'Unknown User',
                avatarUrl: contact.avatarFileLocator,
                objectId: contact.objectId
            }));
            
            // Sort by name
            friendItems.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en-US'));
            setFriends(friendItems);

            // Load pending friend requests count
            const pendingRequests = await client.contact.getPendingFriendRequests();
            setPendingRequestsCount(pendingRequests.length);
        } catch (error) {
            console.error('Failed to load contacts:', error);
            Alert.alert('Error', 'Failed to load contacts');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleChatWithFriend = (friend: FriendItem) => {
        const chatParams: ChatScopeParams = {
            whereFrom: 'contacts',
            goingTo: 'conversation',
            params: {
                targetQueryId: friend.contact.object?.uniqueMark,
                targetName: friend.displayName
            }
        };
        
        updater?.setParam(chatParams);
        scopeChange.change('chat');
    };

    // Remove friend
    const handleRemoveFriend = async (friend: FriendItem) => {
        // Need to get friend's user ID from PrivateChat
        const privateChat = friend.contact.object as any;
        
        console.log('[RemoveFriend] Starting to remove friend');
        console.log('[RemoveFriend] friend.contact:', JSON.stringify(friend.contact, null, 2));
        console.log('[RemoveFriend] currentUser.localId:', currentUser?.localId);
        console.log('[RemoveFriend] privateChat?.initById:', privateChat?.initById);
        console.log('[RemoveFriend] privateChat?.receiverId:', privateChat?.receiverId);
        
        // Option 1: Try to get from privateChat initById/receiverId
        let friendUserId = privateChat?.initById === currentUser?.localId 
            ? privateChat?.receiverId 
            : privateChat?.initById;

        console.log('[RemoveFriend] Option 1 - friendUserId from privateChat:', friendUserId);

        // Option 2: If option 1 fails, find non-current user senderId from message history
        if (!friendUserId && privateChat?.history?.length > 0) {
            console.log('[RemoveFriend] Option 1 failed, trying to get from message history...');
            const otherUserMessage = privateChat.history.find(
                (msg: any) => msg.senderId && msg.senderId !== currentUser?.localId
            );
            if (otherUserMessage) {
                friendUserId = otherUserMessage.senderId;
                console.log('[RemoveFriend] Option 2 - Found friendUserId from message history:', friendUserId);
            }
        }

        // Option 3: If both options 1 and 2 fail, try to get from initById (when other party is initiator)
        if (!friendUserId && privateChat?.initById && privateChat?.initById !== currentUser?.localId) {
            friendUserId = privateChat.initById;
            console.log('[RemoveFriend] Option 3 - Using initById as friendUserId:', friendUserId);
        }

        console.log('[RemoveFriend] Final calculated friendUserId:', friendUserId);

        if (!friendUserId) {
            console.error('[RemoveFriend] Cannot get friend info - all options failed');
            Alert.alert('Error', 'Cannot get friend info');
            return;
        }

        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove "${friend.displayName}" as a friend?\n\nYou won't be able to message them directly, but chat history will be preserved.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setRemovingId(friend.contact.contactId);
                        try {
                            const client = CreateZenCoreClient({
                                ...clientConfig,
                                userToken: credential?.AccessToken!
                            });

                            const result = await client.contact.removeFriend(friendUserId);
                            
                            if (result.success) {
                                // Remove from list
                                setFriends(prev => prev.filter(f => f.contact.contactId !== friend.contact.contactId));
                                Alert.alert('Success', 'Friend removed');
                            } else {
                                Alert.alert('Failed', result.content || 'Failed to remove friend');
                            }
                        } catch (error: any) {
                            console.error('Failed to remove friend:', error);
                            Alert.alert('Error', error.message || 'Failed to remove friend');
                        } finally {
                            setRemovingId(null);
                        }
                    }
                }
            ]
        );
    };

    // Long press friend to show action menu
    const handleLongPressFriend = (friend: FriendItem) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Message', 'Remove Friend'],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0,
                    title: friend.displayName
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleChatWithFriend(friend);
                    } else if (buttonIndex === 2) {
                        handleRemoveFriend(friend);
                    }
                }
            );
        } else {
            // Android uses Alert
            Alert.alert(
                friend.displayName,
                'Select action',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Message', onPress: () => handleChatWithFriend(friend) },
                    { text: 'Remove Friend', style: 'destructive', onPress: () => handleRemoveFriend(friend) }
                ]
            );
        }
    };

    // Function entry configuration
    const functionEntries: FunctionEntry[] = [
        {
            id: 'friend-requests',
            icon: 'user-plus',
            iconColor: '#FF9500',
            iconBg: '#FFF3E0',
            title: 'New Friends',
            badge: pendingRequestsCount,
            onPress: () => navigation.navigate('friend-requests')
        },
        {
            id: 'add-friend',
            icon: 'search',
            iconColor: '#007AFF',
            iconBg: '#E3F2FD',
            title: 'Add Friend',
            onPress: () => navigation.navigate('user-search')
        }
    ];

    // Render function entry item (WeChat style)
    const renderFunctionItem = (entry: FunctionEntry) => (
        <TouchableOpacity
            key={entry.id}
            style={styles.menuItem}
            onPress={entry.onPress}
            activeOpacity={0.6}
        >
            <View style={[styles.menuIcon, { backgroundColor: entry.iconBg }]}>
                <Feather name={entry.icon as any} size={22} color={entry.iconColor} />
            </View>
            <Text style={styles.menuTitle}>{entry.title}</Text>
            <View style={styles.menuRight}>
                {entry.badge && entry.badge > 0 ? (
                    <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>
                            {entry.badge > 99 ? '99+' : entry.badge}
                        </Text>
                    </View>
                ) : null}
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
            </View>
        </TouchableOpacity>
    );

    // Render friend item
    const renderFriendItem = ({ item }: { item: FriendItem }) => {
        const isRemoving = removingId === item.contact.contactId;
        
        return (
            <TouchableOpacity
                style={styles.friendItem}
                onPress={() => handleChatWithFriend(item)}
                onLongPress={() => handleLongPressFriend(item)}
                activeOpacity={0.6}
                delayLongPress={500}
            >
                <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                        {item.displayName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.friendName}>{item.displayName}</Text>
                {isRemoving && (
                    <ActivityIndicator size="small" color="#888" style={styles.removingIndicator} />
                )}
            </TouchableOpacity>
        );
    };

    // List header - function entries
    const ListHeader = () => (
        <View style={styles.headerSection}>
            {functionEntries.map(renderFunctionItem)}
            
            {/* Friend list title */}
            <View style={styles.sectionTitle}>
                <Text style={styles.sectionTitleText}>
                    My Friends ({friends.length})
                </Text>
                <Text style={styles.sectionHintText}>Long press to remove</Text>
            </View>
        </View>
    );

    // Empty state
    const EmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('user-search')}
            >
                <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#07C160" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.contact.contactId}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={EmptyComponent}
                contentContainerStyle={friends.length === 0 ? styles.emptyList : undefined}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadData();
                        }}
                        tintColor="#07C160"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EDEDED',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EDEDED',
    },
    
    // Function entry area
    headerSection: {
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuBadge: {
        backgroundColor: '#FA5151',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginRight: 8,
    },
    menuBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    
    // Section title
    sectionTitle: {
        backgroundColor: '#EDEDED',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitleText: {
        fontSize: 13,
        color: '#888',
    },
    sectionHintText: {
        fontSize: 11,
        color: '#aaa',
    },
    
    // Friend item
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    friendAvatar: {
        width: 44,
        height: 44,
        borderRadius: 6,
        backgroundColor: '#07C160',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    friendAvatarText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    friendName: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    removingIndicator: {
        marginLeft: 8,
    },
    
    // Empty state
    emptyList: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: '#888',
    },
    addButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: '#07C160',
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
});
