import { JumpContext, ScopeContext } from 'navigation/MainNavigator';
import { ChatScopeParams } from 'navigation/types';
import { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Message, EMessageType, SendMessageRequest, CreateZenCoreClient, ClientInitObject, ZenCoreClient } from 'zen-core-chatty-ts';
import { SignalRContext } from 'App';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { addNewMessage } from 'zen-core-chatty-ts';
import { DefaultConfig } from 'ZenClient.config';
import { Feather } from '@expo/vector-icons';
import { useCredential } from 'hooks/useCredential';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Conversation({ route, navigation }: any) {
    const updater = useContext(JumpContext);
    const scopeChange = useContext(ScopeContext);
    const signalRClient = useContext(SignalRContext);
    const dispatch = useDispatch();
    const credential = useCredential();
    const insets = useSafeAreaInsets();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true); // Mark whether this is the initial load
    const isLoadingMoreRef = useRef(false); // Use ref to track loading state to avoid closure issues
    
    const chatParams = (updater?.param as ChatScopeParams).params;
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const userCredential = useSelector((state: RootState) => state.auth.credential);
    
    const [requiringChatMark, setRequiringChatMark] = useState(chatParams?.targetQueryId);
    const chatName = chatParams?.targetName || 'Chat';
    
    // Return to main screen
    const handleGoBack = () => {
        scopeChange.change('main');
    };

    // Fetch chat history messages
    const fetchMessages = async (loadMore: boolean = false) => {
        if (!requiringChatMark) return;
        
        try {
            if (loadMore) {
                setIsLoadingMore(true);
                isLoadingMoreRef.current = true; // Sync update ref
            } else {
                setIsLoading(true);
            }
            
            // Create client instance
            const clientConfig: ClientInitObject = {
                ...DefaultConfig,
                userToken: userCredential?.AccessToken || ''
            };
            const client = CreateZenCoreClient(clientConfig);
            
            // Calculate timestamp parameter
            let sinceTimestamp = Date.now();
            if (loadMore && messages.length > 0) {
                // Get the oldest message timestamp from current list
                const oldestMessage = messages[0];
                sinceTimestamp = oldestMessage.sentTimestamp;
            }
            
            // Call SDK method to get history messages
            const historyMessages = await client.message.getMessageHistory(
                requiringChatMark,
                1000, // Get 1000 messages per request
                sinceTimestamp
            );
            
            // Process returned messages
            if (historyMessages && historyMessages.length > 0) {
                if (loadMore) {
                    // When loading more, insert new messages at the beginning (maintaining old to new order)
                    setMessages(prev => [...historyMessages, ...prev]);
                } else {
                    // On initial load, directly set the message list
                    setMessages(historyMessages);
                    // Initial load complete, mark as ready for onEndReached
                    isInitialLoadRef.current = false;
                }
                
                // Check if there are more messages
                setHasMoreMessages(historyMessages.length === 1000);
            } else {
                if (!loadMore) {
                    setMessages([]);
                    // Initial load complete (even without messages)
                    isInitialLoadRef.current = false;
                }
                setHasMoreMessages(false);
            }
            
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            alert('Failed to load chat history, please check your network connection');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            isLoadingMoreRef.current = false; // Sync update ref
        }
    };
    
    // Load more messages (called when user scrolls to top)
    const loadMoreMessages = () => {
        // Don't trigger on initial load (avoid accidental trigger during initialization)
        if (isInitialLoadRef.current) {
            console.log('ℹ️ [Conversation] Initial loading, skipping onEndReached');
            return;
        }
        
        // If timer is already running, debouncing in progress, return directly
        if (loadMoreTimeoutRef.current) {
            console.log('ℹ️ [Conversation] Debouncing, skipping duplicate trigger');
            return;
        }
        
        // If already loading or no more messages, return directly
        if (isLoadingMoreRef.current || isLoadingMore || !hasMoreMessages) {
            console.log('ℹ️ [Conversation] Loading conditions not met:', {
                isLoadingMoreRef: isLoadingMoreRef.current,
                isLoadingMore,
                hasMoreMessages
            });
            return;
        }
        
        // If too few messages (less than 5), might be initial load, don't trigger
        if (messages.length < 5) {
            console.log('ℹ️ [Conversation] Too few messages, skipping load more');
            return;
        }
        
        // Set loading flag to prevent duplicate triggers
        isLoadingMoreRef.current = true;
        
        // Debounce: delay 500ms execution to avoid rapid consecutive triggers
        loadMoreTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [Conversation] Triggering load more messages');
            loadMoreTimeoutRef.current = null; // Clear timer reference
            
            // Check state again (state may have changed during delay)
            if (!hasMoreMessages || isLoadingMore) {
                console.log('ℹ️ [Conversation] State changed, canceling load');
                isLoadingMoreRef.current = false;
                return;
            }
            
            fetchMessages(true).finally(() => {
                // Reset flag after loading complete
                isLoadingMoreRef.current = false;
            });
        }, 500);
    };
    
    // Send message - using HTTP API (referencing web version)
    const sendMessage = async () => {
        console.log('📤 [Conversation] ========== Sending message ==========');
        console.log('📤 [Conversation] Input content:', inputText?.substring(0, 50));
        console.log('📤 [Conversation] Chat ID:', requiringChatMark);
        console.log('📤 [Conversation] Sending state:', isSending);
        
        if (!inputText.trim() || isSending || !requiringChatMark) {
            console.warn('⚠️ [Conversation] Send conditions not met:', {
                hasInput: !!inputText.trim(),
                hasChatId: !!requiringChatMark,
                isSending
            });
            return;
        }
        
        const messageContent = inputText.trim();
        
        try {
            setIsSending(true);
            setInputText(''); // Clear input immediately for better UX
            console.log('✅ [Conversation] Input cleared');
            
            // Create client instance
            const clientConfig: ClientInitObject = {
                ...DefaultConfig,
                userToken: userCredential?.AccessToken || ''
            };
            const client = CreateZenCoreClient(clientConfig);
            
            const request: SendMessageRequest = {
                ChatUniqueMark: requiringChatMark,
                Content: messageContent,
                MessageType: EMessageType.Normal,
                SentTimestamp: Date.now(),
                IsMentioningAll: false
            };
            
            console.log('📋 [Conversation] Send request:', {
                chatId: request.ChatUniqueMark,
                contentLength: request.Content.length,
                messageType: request.MessageType,
                timestamp: request.SentTimestamp
            });
            
            // Use HTTP API to send message (referencing web version)
            console.log('⏳ [Conversation] Sending message via HTTP API...');
            const result = await client.message.sendMessage(request);
            
            console.log('✅ [Conversation] HTTP API response:', result);
            
            // Check response format: {isQueued: true, resultCanBe: 200} or {success: true}
            const isSuccess = result.success === true || 
                             (result.isQueued === true && result.resultCanBe === 200);
            
            if (isSuccess) {
                console.log('✅ [Conversation] Message sent successfully!');
                console.log('✅ [Conversation] Message ID:', result.messageId);
                console.log('✅ [Conversation] Waiting for SignalR to push new message...');
                // Message will be pushed back via SignalR onIncomeMessage event
            } else {
                const errorMsg = result.errorMessage || result.message || 'Send failed';
                console.error('❌ [Conversation] Send failed:', errorMsg);
                throw new Error(errorMsg);
            }
            
            console.log('📤 [Conversation] ========== Send complete ==========');
            
        } catch (error: any) {
            console.error('❌ [Conversation] ========== Send failed ==========');
            console.error('❌ [Conversation] Error:', error);
            console.error('❌ [Conversation] Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                backendResponse: error?.backendResponse
            });
            
            // Restore input content on send failure
            setInputText(messageContent);
            
            // Provide user-friendly error based on backend response
            const backendError = error?.backendResponse?.errorMessage || error?.message || '';
            let userFriendlyMessage = 'Failed to send message, please check your network connection';
            
            if (backendError.includes('REQUESTING ONLY') || backendError.includes('isFriend:False')) {
                userFriendlyMessage = 'This person is not your friend, cannot send message.\n\nPlease add them as a friend first.';
            } else if (backendError.includes('IsInformal:True')) {
                userFriendlyMessage = 'Your friendship has been dissolved, cannot send message.';
            } else if (backendError.includes('blocked') || backendError.includes('Blocked')) {
                userFriendlyMessage = 'You have been blocked, cannot send message.';
            } else if (backendError.includes('not in') || backendError.includes('NotInGroup')) {
                userFriendlyMessage = 'You are not in this chat, cannot send message.';
            }
            
            Alert.alert('Send Failed', userFriendlyMessage);
        } finally {
            setIsSending(false);
            console.log('📤 [Conversation] Send state reset');
        }
    };
    
    // Set up SignalR message receiving listener and reconnection handling
    useEffect(() => {
        console.log('🔧 [Conversation] useEffect - Setting up SignalR listener');
        console.log('🔧 [Conversation] SignalR client:', signalRClient ? 'exists' : 'does not exist');
        console.log('🔧 [Conversation] Current chat ID:', requiringChatMark);
        
        if (!signalRClient) {
            console.warn('⚠️ [Conversation] SignalR client does not exist, skipping listener setup');
            return;
        }
        
        // Listen for new messages - using IncomeMessage event
        signalRClient.onIncomeMessage = (data) => {
            console.log('📨 [Conversation] ========== Received IncomeMessage ==========');
            console.log('📨 [Conversation] Raw data:', JSON.stringify(data, null, 2));
            
            // Note: SignalR SDK returns camelCase format
            const message = data.message;
            const chatId = data.chatUniqueMark;
            
            console.log('📨 [Conversation] Parsed data:', {
                hasChatId: !!chatId,
                hasMessage: !!message,
                chatId: chatId,
                messageId: message?.traceId,
                currentChatId: requiringChatMark
            });
            
            // Validate data completeness
            if (!message || !chatId) {
                console.error('❌ [Conversation] Message data incomplete!');
                return;
            }
            
            // Only process messages for current chat
            if (chatId === requiringChatMark) {
                console.log('✅ [Conversation] Message belongs to current chat, processing...');
                
                setMessages(prev => {
                    // Check if message already exists (prevent duplicates)
                    const exists = prev.some(m => m.traceId === message.traceId);
                    if (exists) {
                        console.warn('⚠️ [Conversation] Message already exists, skipping:', message.traceId);
                        return prev;
                    }
                    console.log('✅ [Conversation] Adding new message to list:', message.traceId);
                    console.log('✅ [Conversation] Current message count:', prev.length, '-> ', prev.length + 1);
                    return [...prev, message];
                });
                
                console.log('⏳ [Conversation] Dispatching message to Redux');
                dispatch(addNewMessage(message));
                
                // Scroll to bottom
                setTimeout(() => {
                    console.log('📜 [Conversation] Scrolling to bottom');
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
                
                console.log('✅ [Conversation] Message processing complete');
            } else {
                console.log('ℹ️ [Conversation] Message not for current chat, ignoring');
                console.log('ℹ️ [Conversation] Message chat ID:', chatId);
                console.log('ℹ️ [Conversation] Current chat ID:', requiringChatMark);
            }
            console.log('📨 [Conversation] ========== IncomeMessage processing complete ==========');
        };
        
        // Listen for message update events (recall, edit, etc.)
        signalRClient.onPatchMessage = (data) => {
            console.log('📝 [Conversation] ========== Received PatchMessage ==========');
            console.log('📝 [Conversation] Data:', JSON.stringify(data, null, 2));
            
            const updatedMessage = data.updatedMessage;
            const chatId = data.chatUniqueMark;
            
            if (!updatedMessage || !chatId) {
                console.error('❌ [Conversation] Message update data incomplete!');
                return;
            }
            
            // Only process message updates for current chat
            if (chatId === requiringChatMark) {
                console.log('✅ [Conversation] Update belongs to current chat');
                
                setMessages(prev => {
                    const index = prev.findIndex(m => m.traceId === updatedMessage.traceId);
                    if (index !== -1) {
                        // Replace existing message
                        const newMessages = [...prev];
                        newMessages[index] = updatedMessage;
                        console.log('✅ [Conversation] Replacing message:', updatedMessage.traceId, 'type:', data.updateType);
                        return newMessages;
                    }
                    // If message doesn't exist, add it (might be an old message update)
                    console.log('ℹ️ [Conversation] Adding updated message:', updatedMessage.traceId);
                    return [...prev, updatedMessage];
                });
                dispatch(addNewMessage(updatedMessage));
            }
            console.log('📝 [Conversation] ========== PatchMessage processing complete ==========');
        };
        
        // Keep old callback for compatibility
        signalRClient.onContactAndMessageUpdated = (contact, message, totalUnreadCount) => {
            if (message.ofChatId === requiringChatMark) {
                setMessages(prev => {
                    const exists = prev.some(m => m.traceId === message.traceId);
                    if (exists) return prev;
                    return [...prev, message];
                });
                dispatch(addNewMessage(message));
                
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        };
        
        // Listen for reconnection events, auto-rejoin chat room after delay
        const previousOnReconnected = signalRClient.onReconnected;
        signalRClient.onReconnected = (connectionId) => {
            console.log('🔄 [Conversation] SignalR reconnection successful:', connectionId);
            console.log('🔄 [Conversation] Waiting 500ms before rejoining chat room...');
            previousOnReconnected?.(connectionId);
            
            // Delay 500ms before joining chat room to avoid conflicts with server initialization
            if (requiringChatMark) {
                setTimeout(() => {
                    console.log('🚪 [Conversation] Attempting to rejoin chat room:', requiringChatMark);
                    signalRClient.joinChat(requiringChatMark)
                        .then(() => console.log('✅ [Conversation] Rejoined chat room successfully'))
                        .catch((err: any) => console.error('❌ [Conversation] Failed to rejoin chat room:', err.message));
                }, 500);
            }
        };
        
        console.log('✅ [Conversation] SignalR listener setup complete');
        
        return () => {
            console.log('🧹 [Conversation] Cleaning up SignalR listeners');
            // Clean up listeners
            signalRClient.onIncomeMessage = undefined;
            signalRClient.onPatchMessage = undefined;
            signalRClient.onContactAndMessageUpdated = undefined;
            signalRClient.onReconnected = previousOnReconnected;
            // Clean up load more timer
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
                loadMoreTimeoutRef.current = null;
            }
        };
    }, [signalRClient, requiringChatMark]);
    
    // Function to join chat room (with retry mechanism)
    const joinChatWithRetry = async (chatMark: string, retries: number = 3): Promise<boolean> => {
        if (!signalRClient) return false;
        
        for (let i = 0; i < retries; i++) {
            try {
                // Check connection state
                const state = signalRClient.getConnectionState();
                console.log(`Attempting to join chat room (${i + 1}/${retries}), connection state: ${state}`);
                
                if (state !== 'Connected') {
                    // Wait for connection to recover
                    console.log('Waiting for connection to recover...');
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    continue;
                }
                
                await signalRClient.joinChat(chatMark);
                console.log('Successfully joined chat room:', chatMark);
                return true;
            } catch (error: any) {
                console.warn(`Join chat room attempt ${i + 1} failed:`, error.message);
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
        return false;
    };
    
    // Join chat room and fetch messages when component mounts
    useEffect(() => {
        console.log('🎬 [Conversation] useEffect - Initializing chat');
        console.log('🎬 [Conversation] Chat ID:', requiringChatMark);
        console.log('🎬 [Conversation] SignalR:', signalRClient ? 'exists' : 'does not exist');
        
        if (!requiringChatMark || !signalRClient) {
            console.warn('⚠️ [Conversation] Initialization conditions not met, skipping');
            return;
        }
        
        let isMounted = true;
        
        const initChat = async () => {
            console.log('⏳ [Conversation] Starting chat initialization...');
            
            // First fetch message history (via HTTP API, not dependent on SignalR)
            console.log('📖 [Conversation] Fetching message history...');
            fetchMessages();
            
            // Then try to join chat room (for real-time message push)
            console.log('🚪 [Conversation] Attempting to join chat room...');
            const joined = await joinChatWithRetry(requiringChatMark);
            if (!joined && isMounted) {
                console.warn('⚠️ [Conversation] Unable to join chat room, but can still fetch messages by refreshing');
            } else {
                console.log('✅ [Conversation] Chat initialization complete');
            }
        };
        
        initChat();
        
        // Leave chat room when component unmounts
        return () => {
            console.log('🧹 [Conversation] Component unmounting, cleaning up chat room');
            isMounted = false;
            // Clean up load more timer
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
                loadMoreTimeoutRef.current = null;
            }
            // Reset initial load flag
            isInitialLoadRef.current = true;
            
            const state = signalRClient.getConnectionState();
            console.log('🧹 [Conversation] SignalR state:', state);
            
            if (state === 'Connected') {
                console.log('🚪 [Conversation] Leaving chat room:', requiringChatMark);
                signalRClient.leaveChat(requiringChatMark)
                    .then(() => console.log('✅ [Conversation] Left chat room:', requiringChatMark))
                    .catch((error: any) => console.error('❌ [Conversation] Failed to leave chat room:', error.message));
            }
        };
    }, [requiringChatMark, signalRClient]);
    
    // Reset state when requiringChatMark changes
    useEffect(() => {
        if (requiringChatMark && requiringChatMark !== chatParams?.targetQueryId) {
            setMessages([]);
            setHasMoreMessages(true);
            // Reset initial load flag
            isInitialLoadRef.current = true;
            // Reset loading state
            isLoadingMoreRef.current = false;
            // Clean up load more timer
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
                loadMoreTimeoutRef.current = null;
            }
        }
    }, [requiringChatMark, chatParams?.targetQueryId]);
    
    // Handle accept friend request
    const handleAcceptFriendRequest = async (message: Message) => {
        if (!message.traceId) return;
        
        setProcessingRequestId(message.traceId);
        try {
            const client = CreateZenCoreClient({
                ...DefaultConfig,
                userToken: credential?.AccessToken!
            });

            const result = await client.contact.acceptFriendRequest(message.traceId);
            
            if (result.success) {
                Alert.alert('Success', 'Friend request accepted');
                // Refresh message list
                fetchMessages();
            } else {
                Alert.alert('Failed', result.content || 'Failed to accept friend request');
            }
        } catch (error: any) {
            console.error('Failed to accept friend request:', error);
            Alert.alert('Error', error.message || 'Operation failed');
        } finally {
            setProcessingRequestId(null);
        }
    };

    // Handle reject friend request
    const handleRejectFriendRequest = async (message: Message) => {
        if (!message.traceId) return;
        
        Alert.alert(
            'Confirm',
            'Are you sure you want to reject this friend request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingRequestId(message.traceId);
                        try {
                            const client = CreateZenCoreClient({
                                ...DefaultConfig,
                                userToken: credential?.AccessToken!
                            });

                            const result = await client.contact.rejectFriendRequest(message.traceId);
                            
                            if (result.success) {
                                Alert.alert('Success', 'Friend request rejected');
                                fetchMessages();
                            } else {
                                Alert.alert('Failed', result.content || 'Failed to reject friend request');
                            }
                        } catch (error: any) {
                            console.error('Failed to reject friend request:', error);
                            Alert.alert('Error', error.message || 'Operation failed');
                        } finally {
                            setProcessingRequestId(null);
                        }
                    }
                }
            ]
        );
    };

    // Render friend request message card
    const renderFriendRequestCard = (message: Message) => {
        const isOwnRequest = message.senderId === currentUser?.localId;
        const info = message.info || '';
        const isProcessing = processingRequestId === message.traceId;
        
        // Determine request status
        let requestStatus: 'pending' | 'accepted' | 'rejected' = 'pending';
        if (info.includes('Accepted')) {
            requestStatus = 'accepted';
        } else if (info.includes('Rejected')) {
            requestStatus = 'rejected';
        }
        
        return (
            <View style={styles.requestCardContainer}>
                <View style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                        <Feather name="user-plus" size={24} color="#007AFF" />
                        <Text style={styles.requestTitle}>
                            {isOwnRequest ? 'You sent a friend request' : 'Friend request received'}
                        </Text>
                    </View>
                    
                    <Text style={styles.requestSender}>
                        From: {message.senderName}
                    </Text>
                    
                    <Text style={styles.requestTime}>
                        {new Date(message.sentTimestamp).toLocaleString('en-US')}
                    </Text>
                    
                    {/* Show action buttons if received request and status is pending */}
                    {!isOwnRequest && requestStatus === 'pending' && (
                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={[styles.requestButton, styles.rejectButton]}
                                onPress={() => handleRejectFriendRequest(message)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#FF3B30" />
                                ) : (
                                    <>
                                        <Feather name="x" size={16} color="#FF3B30" />
                                        <Text style={styles.rejectButtonText}>Reject</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.requestButton, styles.acceptButton]}
                                onPress={() => handleAcceptFriendRequest(message)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Feather name="check" size={16} color="#fff" />
                                        <Text style={styles.acceptButtonText}>Accept</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    {/* Show request status */}
                    {requestStatus !== 'pending' && (
                        <View style={styles.requestStatusBadge}>
                            <Text style={styles.requestStatusText}>
                                {requestStatus === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // Render system event message
    const renderEventMessage = (message: Message) => {
        return (
            <View style={styles.eventMessageContainer}>
                <Text style={styles.eventMessageText}>
                    {message.content}
                </Text>
            </View>
        );
    };
    
    // Render message item
    const renderMessageItem = ({ item }: { item: Message }) => {
        // If friend request message
        if (item.type === EMessageType.Requesting) {
            return renderFriendRequestCard(item);
        }
        
        // If system event message
        if (item.type === EMessageType.Event) {
            return renderEventMessage(item);
        }
        
        // Normal message
        const isOwnMessage = item.senderId === currentUser?.localId;
        
        return (
            <View style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.otherMessage
            ]}>
                <View style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownBubble : styles.otherBubble
                ]}>
                    <Text style={[
                        styles.messageSender,
                        isOwnMessage && styles.ownMessageText
                    ]}>
                        {item.senderName}
                    </Text>
                    <Text style={[
                        styles.messageContent,
                        isOwnMessage && styles.ownMessageText
                    ]}>
                        {item.content}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        isOwnMessage && styles.ownMessageText
                    ]}>
                        {new Date(item.sentTimestamp).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </Text>
                </View>
            </View>
        );
    };
    
    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Chat title bar - with back button */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={handleGoBack}
                >
                    <Feather name="arrow-left" size={24} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {chatName}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {signalRClient?.getConnectionState() === 'Connected' ? 'Online' : 'Offline'}
                    </Text>
                </View>
                <View style={styles.headerRight} />
            </View>
            
            {/* Message list */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item, index) => `${item.traceId}-${index}`}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                onContentSizeChange={() => {
                    // Only auto scroll to bottom on initial load
                    if (!isLoading && !isLoadingMore) {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }
                }}
                onEndReached={loadMoreMessages}
                onEndReachedThreshold={0.1}
                ListHeaderComponent={
                    isLoadingMore ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Loading chat history...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No chat history</Text>
                        </View>
                    )
                }
            />
            
            {/* Input area */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!inputText.trim() || isSending) && styles.sendButtonDisabled
                    ]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || isSending}
                >
                    <Text style={styles.sendButtonText}>
                        {isSending ? 'Sending...' : 'Send'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    headerRight: {
        width: 40, // Placeholder to keep title centered
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        padding: 16,
    },
    messageContainer: {
        marginBottom: 12,
    },
    ownMessage: {
        alignItems: 'flex-end',
    },
    otherMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    ownBubble: {
        backgroundColor: '#007AFF',
    },
    otherBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageSender: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    messageContent: {
        fontSize: 16,
        color: '#333',
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    ownMessageText: {
        color: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'flex-end',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        marginRight: 12,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    // Friend request card styles
    requestCardContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    requestTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    requestSender: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    requestTime: {
        fontSize: 12,
        color: '#999',
        marginBottom: 12,
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    requestButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 5,
    },
    acceptButton: {
        backgroundColor: '#007AFF',
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    rejectButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    rejectButtonText: {
        color: '#FF3B30',
        fontWeight: '600',
    },
    requestStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    requestStatusText: {
        fontSize: 12,
        color: '#666',
    },
    // System event message styles
    eventMessageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    eventMessageText: {
        fontSize: 12,
        color: '#999',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
});