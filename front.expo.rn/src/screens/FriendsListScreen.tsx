import React, { useEffect, useState, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CreateZenCoreClient, Contact, PrivateChat } from 'zen-core-chatty-ts';
import { useCredential } from 'hooks/useCredential';
import { ContextedClientConfig } from 'App';
import { useSelector } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { JumpContext, ScopeContext } from 'navigation/MainNavigator';
import { ChatScopeParams } from 'navigation/types';

interface FriendInfo {
    contact: Contact;
    friendUser: {
        localId: string;
        displayName: string;
        avatarFileLocator?: string;
        bio?: string;
    };
}

export default function FriendsListScreen({ navigation }: any) {
    const [friends, setFriends] = useState<FriendInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const credential = useCredential();
    const clientConfig = useContext(ContextedClientConfig);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const updater = useContext(JumpContext);
    const scopeChange = useContext(ScopeContext);

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        if (!credential?.AccessToken) return;
        
        setLoading(true);
        try {
            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential.AccessToken
            });

            const contacts = await client.contact.getFriends();
            
            // Parse friend info
            const friendInfos: FriendInfo[] = contacts.map(contact => {
                // Use Contact's displayName, which is the friend name set by backend
                return {
                    contact,
                    friendUser: {
                        localId: contact.objectId || '', // Use Contact's objectId (chatId)
                        displayName: contact.displayName || 'Unknown User',
                        avatarFileLocator: contact.avatarFileLocator || undefined,
                        bio: undefined // Contact doesn't have bio info
                    }
                };
            });
            
            setFriends(friendInfos);
        } catch (error) {
            console.error('Failed to load friends list:', error);
            Alert.alert('Error', 'Failed to load friends list');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleChatWithFriend = (friendInfo: FriendInfo) => {
        // Navigate to chat screen
        const chatParams: ChatScopeParams = {
            whereFrom: 'friends',
            goingTo: 'conversation',
            params: {
                targetQueryId: friendInfo.contact.object.uniqueMark,
                targetName: friendInfo.friendUser.displayName
            }
        };
        
        // Set params and switch to chat scope
        updater?.setParam(chatParams);
        scopeChange.change('chat');
    };

    const renderFriendItem = ({ item }: { item: FriendInfo }) => {
        const unreadCount = item.contact.lastUnreadCount || 0;
        
        return (
            <TouchableOpacity
                style={styles.friendCard}
                onPress={() => handleChatWithFriend(item)}
            >
                <View style={styles.avatarContainer}>
                    {item.friendUser.avatarFileLocator ? (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {item.friendUser.displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.avatar}>
                            <Feather name="user" size={32} color="#007AFF" />
                        </View>
                    )}
                    
                    {/* Unread message badge */}
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.friendInfo}>
                    <View style={styles.friendHeader}>
                        <Text style={styles.friendName}>{item.friendUser.displayName}</Text>
                        {item.contact.isPinned && (
                            <Feather name="star" size={16} color="#FFD700" />
                        )}
                    </View>
                    
                    {item.friendUser.bio && (
                        <Text style={styles.friendBio} numberOfLines={1}>
                            {item.friendUser.bio}
                        </Text>
                    )}
                    
                    <Text style={styles.lastUsedText}>
                        Last contact: {new Date(item.contact.lastUsed).toLocaleDateString('en-US')}
                    </Text>
                </View>
                
                <Feather name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Friends</Text>
                <Text style={styles.headerSubtitle}>{friends.length} friends total</Text>
            </View>

            {/* Friends list */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.contact.contactId}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadFriends();
                            }}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Feather name="users" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>No friends yet</Text>
                            <Text style={styles.emptySubtext}>Go add some friends!</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E8F4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    friendInfo: {
        flex: 1,
    },
    friendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    friendBio: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    lastUsedText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#ccc',
    },
});

