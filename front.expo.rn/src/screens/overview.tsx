import { Alert, FlatList, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, ActionSheetIOS, Platform } from 'react-native';
import { Contact, EMessageType, ImageActs, Message, CreateZenCoreClient, GroupChat } from 'zen-core-chatty-ts';
import ListItem, { ListItemProps } from 'components/ListItem';
import { useContext, useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { SignalRContext, ContextedClientConfig } from 'App';
import { UpdateRecentsData } from 'zen-core-chatty-ts/signalr-client';
import { useCredential } from 'hooks/useCredential';
import { JumpContext, ScopeContext } from 'navigation/MainNavigator';
import { ChatScopeParams } from 'navigation/types';

export default function Overview() {
    const signalRClient = useContext(SignalRContext);
    const clientConfig = useContext(ContextedClientConfig);
    const credential = useCredential();
    const dispatch = useDispatch();
    const updater = useContext(JumpContext);
    const scopeChange = useContext(ScopeContext);

    // Use local state to store contact data (fetched from API)
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Format last message time
    const formatLastMessageTime = (timestamp?: number) => {
        if (!timestamp) return "notime";

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Get latest message (history may be sorted chronologically, newest at the end)
    const getLatestMessage = (contact: Contact): Message | null => {
        const history = contact.object?.history;
        if (!history || history.length === 0) return null;

        // Find message with the largest timestamp (newest)
        return history.reduce((latest, current) => {
            const latestMsg = latest as Message;
            const currentMsg = current as Message;
            return (currentMsg.sentTimestamp > latestMsg.sentTimestamp) ? currentMsg : latestMsg;
        }, history[0]) as Message;
    };

    // Get message preview
    const getMessagePreview = (contact: Contact) => {
        const lastMessage = getLatestMessage(contact);
        if (!lastMessage) return "No msg";

        switch (lastMessage.type) {
            case EMessageType.Announcement:
                return "[ANN] " + lastMessage.content;
            case EMessageType.Requesting:
                return "[Request] " + lastMessage.content;
            case EMessageType.Event:
                return "[Event] " + lastMessage.content;
            default:
                return lastMessage.content || " none ";
        }
    };

    const transformContactItem = (contact: Contact) => {
        const latestMessage = getLatestMessage(contact);
        return {
            avatarUrl: ImageActs.getContactChatAvatarAsUrl(contact),
            title: contact.displayName ?? "unknown",
            subtitle: getMessagePreview(contact),
            topBadge: contact.lastUnreadCount > 0 ? `${contact.lastUnreadCount}` : undefined,
            CIA: contact.isPinned ? (<Feather name="map-pin" size={16} color="#007AFF" />) : undefined,
            cornerTip: formatLastMessageTime(latestMessage?.sentTimestamp),
            highlight: contact.hasVitalUnread
        } as ListItemProps;
    };

    // Data fetching logic - get recent contacts from API
    const fetchContacts = async () => {
        if (!credential?.AccessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential.AccessToken
            });

            console.log('[Overview] ⏱️ 开始网络请求...');
            const startTime = Date.now();

            const recentContacts = await client.contact.getRecentContacts();

            const networkTime = Date.now() - startTime;
            console.log(`[Overview] ⏱️ 网络请求完成，耗时: ${networkTime}ms`);

            console.log('[Overview] ========== Fetching contacts list ==========');
            console.log('[Overview] Raw data count:', recentContacts.length);

            // Debug: print detailed info for each contact
            recentContacts.forEach((contact, index) => {
                const historyCount = contact.object?.history?.length ?? 0;
                console.log(`[Overview] [${index}] ${contact.displayName} - contactId: ${contact.contactId}, chatMark: ${contact.object.uniqueMark}, historyCount: ${historyCount}`);
            });

            // Frontend deduplication: dedupe by displayName, keep the one with message history
            const contactMap = new Map<string, Contact>();
            recentContacts.forEach(contact => {
                const key = contact.displayName || contact.contactId;
                const existing = contactMap.get(key);
                const currentHistoryCount = contact.object?.history?.length ?? 0;
                const existingHistoryCount = existing?.object?.history?.length ?? 0;

                // If no contact with same name exists, or current contact has more messages, use current contact
                if (!existing || currentHistoryCount > existingHistoryCount) {
                    contactMap.set(key, contact);
                }
            });
            const uniqueContacts = Array.from(contactMap.values());

            if (uniqueContacts.length !== recentContacts.length) {
                console.log(`[Overview] After deduping by displayName: ${uniqueContacts.length} (removed ${recentContacts.length - uniqueContacts.length} duplicates)`);
            }

            // Sort by latest message time (newest first)
            const sortedContacts = [...uniqueContacts].sort((a, b) => {
                const aHistory = a.object?.history;
                const bHistory = b.object?.history;

                // Get latest message timestamp
                const getLatestTimestamp = (history: any[] | undefined): number => {
                    if (!history || history.length === 0) return 0;
                    return Math.max(...history.map((m: Message) => m.sentTimestamp || 0));
                };

                const aTime = getLatestTimestamp(aHistory);
                const bTime = getLatestTimestamp(bHistory);

                return bTime - aTime; // Sort descending, newest first
            });

            setContacts(sortedContacts);
            console.log('[Overview] Final contacts count:', sortedContacts.length);

            // Debug: print info for first contact after sorting
            if (sortedContacts.length > 0) {
                const firstContact = sortedContacts[0];
                console.log('[Overview] First contact after sorting:', firstContact.displayName);
                console.log('[Overview] First contact history:', firstContact.object?.history?.length ?? 0);
                if (firstContact.object?.history?.length) {
                    const history = firstContact.object.history;
                    const timestamps = history.map((m: Message) => m.sentTimestamp);
                    console.log('[Overview] Message timestamps:', timestamps);
                    console.log('[Overview] Latest message time:', new Date(Math.max(...timestamps)).toLocaleString());
                } else {
                    console.warn('[Overview] ⚠️ First contact has no message history!');
                }
            }
            console.log('[Overview] ========== Contacts list loaded ==========')
        } catch (err) {
            setError('Failed to fetch contacts');
            console.error('Failed to fetch contacts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch data when component mounts or credentials change
    useEffect(() => {
        if (credential?.AccessToken) {
            fetchContacts();
        }
    }, [credential?.AccessToken]);

    // Subscribe to SignalR UpdateRecents event for real-time updates
    useEffect(() => {
        if (!signalRClient) {
            console.log('[Overview] SignalR client not available yet');
            return;
        }

        // Handler for UpdateRecents event
        const handleUpdateRecents = (data: UpdateRecentsData) => {
            console.log('[Overview] ========== Received UpdateRecents ==========');
            console.log('[Overview] ChatUniqueMark:', data.chatUniqueMark);
            console.log('[Overview] Message:', data.message?.content?.substring(0, 50));
            console.log('[Overview] UnreadCount:', data.totalUnreadCount);

            setContacts(prevContacts => {
                // Find the contact by chatUniqueMark
                const contactIndex = prevContacts.findIndex(
                    c => c.object?.uniqueMark === data.chatUniqueMark
                );

                if (contactIndex >= 0) {
                    // Contact exists, update it
                    const updatedContacts = [...prevContacts];
                    const existingContact = updatedContacts[contactIndex];

                    // Create updated contact with new message
                    const updatedContact = {
                        ...existingContact,
                        lastUnreadCount: data.totalUnreadCount,
                        object: {
                            ...existingContact.object,
                            history: [
                                data.message,
                                ...(existingContact.object?.history || [])
                            ]
                        }
                    };

                    // Remove from current position
                    updatedContacts.splice(contactIndex, 1);
                    // Add to top (most recent)
                    updatedContacts.unshift(updatedContact as Contact);

                    console.log('[Overview] Updated existing contact:', existingContact.displayName);
                    return updatedContacts;
                } else {
                    // Contact not in list - this is a new chat, need to fetch full data
                    console.log('[Overview] New chat detected, refreshing contact list');
                    // Trigger a refresh to get the full contact data
                    fetchContacts();
                    return prevContacts;
                }
            });

            console.log('[Overview] ========== UpdateRecents processed ==========');
        };

        // Setup function to set handler when connected
        const setupHandler = () => {
            const state = signalRClient.getConnectionState();
            if (state === 'Connected') {
                console.log('[Overview] ✅ SignalR connected, setting up UpdateRecents listener');
                signalRClient.onUpdateRecents = handleUpdateRecents;
                return true;
            }
            console.log('[Overview] ⏳ SignalR not connected yet, state:', state);
            return false;
        };

        // Try to setup immediately
        if (!setupHandler()) {
            // If not connected, retry every 500ms until connected
            const retryInterval = setInterval(() => {
                if (setupHandler()) {
                    clearInterval(retryInterval);
                }
            }, 500);

            // Also listen for reconnection
            const previousReconnected = signalRClient.onReconnected;
            signalRClient.onReconnected = (connectionId) => {
                previousReconnected?.(connectionId);
                console.log('[Overview] SignalR reconnected, re-setting UpdateRecents listener');
                signalRClient.onUpdateRecents = handleUpdateRecents;
            };

            return () => {
                clearInterval(retryInterval);
                signalRClient.onReconnected = previousReconnected;
                console.log('[Overview] Cleaned up SignalR UpdateRecents listener');
            };
        }

        // Listen for reconnection even if initially connected
        const previousReconnected = signalRClient.onReconnected;
        signalRClient.onReconnected = (connectionId) => {
            previousReconnected?.(connectionId);
            console.log('[Overview] SignalR reconnected, re-setting UpdateRecents listener');
            signalRClient.onUpdateRecents = handleUpdateRecents;
        };

        return () => {
            signalRClient.onReconnected = previousReconnected;
            console.log('[Overview] Cleaned up SignalR UpdateRecents listener');
        };
    }, [signalRClient]);

    // Click contact to enter chat
    const handleChatWithContact = (contact: Contact, isPrivateChatFromGroup = false) => {
        // Use contact.object.uniqueMark as chat identifier (consistent with ContactsScreen)
        const chatUniqueMark = contact.object?.uniqueMark;

        if (!chatUniqueMark) {
            console.error('Cannot get chat identifier:', contact);
            Alert.alert('Error', 'Cannot open chat, contact data incomplete');
            return;
        }

        const chatParams: ChatScopeParams = {
            whereFrom: 'overview',
            goingTo: 'conversation',
            params: {
                targetQueryId: chatUniqueMark,
                targetName: contact.displayName || 'Unknown User',
                isTargetAGroup: contact.object instanceof GroupChat,
                isOpenningConversation: true,
                isTargetConversationInGroup: isPrivateChatFromGroup
            }
        };

        console.log('Entering chat:', chatParams);
        updater?.setParam(chatParams);
        scopeChange.change('chat');
    };

    // Long press contact to show action menu
    const handleLongPressContact = (contact: Contact) => {
        const contactName = contact.displayName || 'this chat';
        console.log('[Overview] Long press chat:', contact.contactId, contactName);

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Delete Chat'],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0,
                    title: contactName
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleDeleteChat(contact);
                    }
                }
            );
        } else {
            // Android uses Alert
            Alert.alert(
                contactName,
                'Select action',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete Chat',
                        style: 'destructive',
                        onPress: () => handleDeleteChat(contact)
                    }
                ]
            );
        }
    };

    // Delete chat
    const handleDeleteChat = (contact: Contact) => {
        const contactName = contact.displayName || 'this chat';
        console.log('[Overview] Requesting to delete chat:', contact.contactId);

        Alert.alert(
            'Delete Chat',
            `Are you sure you want to delete the chat with "${contactName}"?\n\nThe chat will be removed from the list, but chat history will be preserved.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('[Overview] Confirming delete chat:', contact.contactId);

                        try {
                            const client = CreateZenCoreClient({
                                ...clientConfig,
                                userToken: credential?.AccessToken!
                            });

                            // Call backend API to delete chat
                            const result = await client.contact.deleteContact(contact.contactId);
                            console.log('[Overview] Delete result:', result);

                            if (result.success) {
                                // Remove from local list
                                setContacts(prevContacts =>
                                    prevContacts.filter(c => c.contactId !== contact.contactId)
                                );
                                Alert.alert('Success', 'Chat deleted');
                            } else {
                                Alert.alert('Failed', result.message || 'Failed to delete chat');
                            }
                        } catch (error: any) {
                            console.error('[Overview] Failed to delete chat:', error);
                            Alert.alert('Error', error?.message || 'Failed to delete chat');
                        }
                    }
                }
            ]
        );
    };

    // Handle error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchContacts}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Handle loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Getting recent chats...</Text>
            </View>
        );
    }

    if (contacts.length === 0 && !loading) {
        return (
            <View style={styles.emptyContainer}>
                <Feather name="users" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No chats</Text>
                <Text style={styles.emptySubtext}>todo: the backend currently maybe return entire contact as using entire contact method</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchContacts}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <View className='bg-gray-200' style={{
                padding: 16
            }}>
                <Text>Here will go searchbox</Text>
            </View>
            <FlatList
                style={{
                    borderTopColor: "#9e9e9e68",
                    borderTopWidth: 1,
                }}
                className='grow pb-5 border-t border-t-gray-300'
                data={contacts}
                renderItem={({ item }) => (
                    <ListItem
                        item={transformContactItem(item)}
                        onPress={() => handleChatWithContact(item)}
                        onLongPress={() => handleLongPressContact(item)}
                    />
                )}
                keyExtractor={(item) => item.contactId}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchContacts();
                        }}
                    />
                }
            />
        </>
    );
}


export const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ff3b30',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        margin: 8,
        textAlign: 'center',
    },
});