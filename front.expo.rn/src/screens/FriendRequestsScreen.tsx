import React, { useEffect, useState, useContext, useCallback } from 'react';
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
import { CreateZenCoreClient, Message } from 'zen-core-chatty-ts';
import { useCredential } from 'hooks/useCredential';
import { ContextedClientConfig } from 'App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

type FriendRequest = Message & {
    requestStatus?: 'pending' | 'accepted' | 'rejected' | 'revoked';
    receiverName?: string; // Receiver name (for sent requests)
};

export default function FriendRequestsScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const credential = useCredential();
    const clientConfig = useContext(ContextedClientConfig);
    const insets = useSafeAreaInsets();

    const handleGoBack = () => {
        navigation.goBack();
    };

    // Auto refresh when page gains focus
    useFocusEffect(
        useCallback(() => {
            loadAllRequests();
        }, [credential?.AccessToken])
    );

    const parseRequestStatus = (message: Message): FriendRequest => {
        const info = message.info || '';
        let requestStatus: 'pending' | 'accepted' | 'rejected' | 'revoked' = 'pending';
        
        if (info.includes('Accepted')) {
            requestStatus = 'accepted';
        } else if (info.includes('Rejected')) {
            requestStatus = 'rejected';
        } else if (info.includes('Revoked')) {
            requestStatus = 'revoked';
        }
        
        return { ...message, requestStatus };
    };

    // Load all requests (load both received and sent)
    const loadAllRequests = async () => {
        if (!credential?.AccessToken) {
            console.log('No credentials, skipping load');
            return;
        }
        
        setLoading(true);
        try {
            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential.AccessToken
            });

            // Load both lists in parallel
            const [receivedData, sentData] = await Promise.all([
                client.contact.getPendingFriendRequests(),
                client.contact.getSentFriendRequests()
            ]);

            // Process received requests
            const parsedReceived = receivedData.map(parseRequestStatus);
            setReceivedRequests(parsedReceived);

            // Process sent requests - try to get receiver info
            console.log('[FriendRequests] Starting to process sent requests, count:', sentData.length);
            const parsedSent = await Promise.all(sentData.map(async (msg, index) => {
                const parsed = parseRequestStatus(msg);
                // Parse receiver ID from content
                console.log(`[FriendRequests] Processing request ${index + 1} - traceId: ${msg.traceId}, content: ${msg.content}`);
                const receiverMatch = msg.content?.match(/receiver:([^;]+)/);
                if (receiverMatch) {
                    const receiverId = receiverMatch[1];
                    console.log(`[FriendRequests] Parsed receiverId: ${receiverId}`);
                    try {
                        // Try to get receiver user info
                        console.log(`[FriendRequests] Calling queryOthersInfoByPrivacy with: ${receiverId}`);
                        const userInfo = await client.contact.queryOthersInfoByPrivacy(receiverId);
                        console.log(`[FriendRequests] API result:`, JSON.stringify(userInfo));
                        if (userInfo.success) {
                            parsed.receiverName = userInfo.displayName || userInfo.customId || 'User';
                            console.log(`[FriendRequests] Set receiver name: ${parsed.receiverName}`);
                        } else {
                            console.warn(`[FriendRequests] API returned failure: ${userInfo.message}`);
                        }
                    } catch (e: any) {
                        // Failed to get, use default value
                        console.error('[FriendRequests] Failed to get receiver info:', e?.message || e);
                        console.error('[FriendRequests] Error details:', JSON.stringify(e, null, 2));
                    }
                } else {
                    console.warn(`[FriendRequests] Cannot parse receiverId from content: ${msg.content}`);
                }
                return parsed;
            }));
            setSentRequests(parsedSent);

            console.log('Load complete - Received:', parsedReceived.length, 'Sent:', parsedSent.length);
        } catch (error) {
            console.error('Failed to load friend requests:', error);
            Alert.alert('Error', 'Failed to load friend requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAccept = async (request: FriendRequest) => {
        if (!request.traceId) return;
        
        setProcessingId(request.traceId);
        try {
            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential?.AccessToken!
            });

            const result = await client.contact.acceptFriendRequest(request.traceId);
            
            if (result.success) {
                Alert.alert('Success', 'Friend added');
                loadAllRequests();
            } else {
                Alert.alert('Failed', result.content || 'Operation failed');
            }
        } catch (error: any) {
            console.error('Failed to accept friend request:', error);
            Alert.alert('Error', error.message || 'Operation failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request: FriendRequest) => {
        if (!request.traceId) return;
        
        Alert.alert('Confirm', 'Are you sure you want to reject?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    setProcessingId(request.traceId);
                    try {
                        const client = CreateZenCoreClient({
                            ...clientConfig,
                            userToken: credential?.AccessToken!
                        });
                        const result = await client.contact.rejectFriendRequest(request.traceId);
                        if (result.success) {
                            Alert.alert('Success', 'Rejected');
                            loadAllRequests();
                        } else {
                            Alert.alert('Failed', result.content || 'Operation failed');
                        }
                    } catch (error: any) {
                        Alert.alert('Error', error.message || 'Operation failed');
                    } finally {
                        setProcessingId(null);
                    }
                }
            }
        ]);
    };

    const handleRevoke = async (request: FriendRequest) => {
        if (!request.traceId) return;
        
        Alert.alert('Confirm', 'Are you sure you want to revoke?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Revoke',
                style: 'destructive',
                onPress: async () => {
                    setProcessingId(request.traceId);
                    try {
                        const client = CreateZenCoreClient({
                            ...clientConfig,
                            userToken: credential?.AccessToken!
                        });
                        const result = await client.contact.revokeFriendRequest(request.traceId);
                        if (result.success) {
                            Alert.alert('Success', 'Revoked');
                            loadAllRequests();
                        } else {
                            Alert.alert('Failed', result.content || 'Operation failed');
                        }
                    } catch (error: any) {
                        Alert.alert('Error', error.message || 'Operation failed');
                    } finally {
                        setProcessingId(null);
                    }
                }
            }
        ]);
    };

    // Format time
    const formatTime = (timestamp: number) => {
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

    // Get sender display name (received requests)
    const getSenderName = (request: FriendRequest) => {
        return request.senderName || 'Unknown User';
    };

    // Get receiver display name (sent requests)
    const getReceiverName = (request: FriendRequest) => {
        return request.receiverName || 'User';
    };

    // Get display name
    const getDisplayName = (request: FriendRequest, isReceived: boolean) => {
        return isReceived ? getSenderName(request) : getReceiverName(request);
    };

    const renderRequestItem = ({ item }: { item: FriendRequest }) => {
        const isProcessing = processingId === item.traceId;
        const isPending = item.requestStatus === 'pending';
        const isReceived = activeTab === 'received';
        const displayName = getDisplayName(item, isReceived);
        
        return (
            <View style={styles.requestItem}>
                {/* Avatar */}
                <View style={[styles.avatar, !isReceived && styles.avatarSent]}>
                    <Text style={styles.avatarText}>
                        {displayName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                
                {/* Info */}
                <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{displayName}</Text>
                    <Text style={styles.requestTime}>
                        {isReceived ? 'Wants to be your friend' : 'Waiting for verification'}
                    </Text>
                </View>
                
                {/* Action buttons */}
                <View style={styles.actionArea}>
                    {isPending ? (
                        isReceived ? (
                            // Received request: show accept/reject buttons
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.acceptButton}
                                    onPress={() => handleAccept(item)}
                                    disabled={isProcessing}
                                    activeOpacity={0.7}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.acceptButtonText}>Accept</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Sent request: show waiting or revoke
                            <Text style={styles.pendingText}>Pending</Text>
                        )
                    ) : (
                        // Processed status
                        <Text style={[
                            styles.statusText,
                            item.requestStatus === 'accepted' && styles.statusAccepted
                        ]}>
                            {item.requestStatus === 'accepted' ? 'Added' : 
                             item.requestStatus === 'rejected' ? 'Rejected' : 'Expired'}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const EmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Feather name="user-plus" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>
                {activeTab === 'received' ? 'No new friends' : 'No sent requests'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Top navigation bar */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={handleGoBack}
                    activeOpacity={0.6}
                >
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Friends</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Tab switch */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'received' && styles.activeTab]}
                    onPress={() => setActiveTab('received')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
                        Received
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
                    onPress={() => setActiveTab('sent')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
                        Sent
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#07C160" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'received' ? receivedRequests : sentRequests}
                    renderItem={renderRequestItem}
                    keyExtractor={(item, index) => item.traceId || `request-${index}`}
                    contentContainerStyle={
                        (activeTab === 'received' ? receivedRequests : sentRequests).length === 0 
                            ? styles.emptyList 
                            : undefined
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadAllRequests();
                            }}
                            tintColor="#07C160"
                        />
                    }
                    ListEmptyComponent={EmptyComponent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EDEDED',
    },
    
    // Top navigation bar
    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginRight: 28,
    },
    headerRight: {
        width: 28,
    },
    
    // Tab switch
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#07C160',
    },
    tabText: {
        fontSize: 15,
        color: '#888',
    },
    activeTabText: {
        color: '#07C160',
        fontWeight: '600',
    },
    
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Request item
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: '#07C160',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSent: {
        backgroundColor: '#007AFF',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    requestInfo: {
        flex: 1,
        marginLeft: 12,
    },
    requestName: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    requestTime: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    
    // Action area
    actionArea: {
        marginLeft: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#07C160',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 4,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    pendingText: {
        fontSize: 13,
        color: '#888',
    },
    statusText: {
        fontSize: 13,
        color: '#888',
    },
    statusAccepted: {
        color: '#07C160',
    },
    
    // Empty state
    emptyList: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: '#888',
    },
});
