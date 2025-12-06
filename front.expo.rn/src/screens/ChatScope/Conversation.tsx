import { JumpContext } from 'navigation/MainNavigator';
import { ChatScopeParams } from 'navigation/types';
import { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Message, EMessageType, SendMessageRequest, CreateZenCoreClient, ClientInitObject } from 'zen-core-chatty-ts';
import { SignalRContext } from 'App';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { addNewMessage } from 'zen-core-chatty-ts';
import { DefaultConfig } from 'ZenClient.config';

export default function Conversation({ route, navigation }: any) {
    const updater = useContext(JumpContext);
    const signalRClient = useContext(SignalRContext);
    const dispatch = useDispatch();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    
    const chatParams = (updater?.param as ChatScopeParams).params;
    const currentUser = useSelector((state: RootState) => state.auth.user);
    
    const [requiringChatMark, setRequiringChatMark] = useState(chatParams?.targetQueryId);

    // 获取聊天历史消息
    const fetchMessages = async (loadMore: boolean = false) => {
        if (!requiringChatMark) return;
        
        try {
            if (loadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }
            
            // 创建客户端实例
            const clientConfig: ClientInitObject = {
                ...DefaultConfig,
                userToken: useSelector((state: RootState) => state.auth.credential?.AccessToken) || ''
            };
            const client = CreateZenCoreClient(clientConfig);
            
            // 计算时间戳参数
            let sinceTimestamp = Date.now();
            if (loadMore && messages.length > 0) {
                // 获取当前列表中最老消息的时间戳
                const oldestMessage = messages[0];
                sinceTimestamp = oldestMessage.sentTimestamp;
            }
            
            // 调用SDK方法获取历史消息
            const historyMessages = await client.message.getMessageHistory(
                requiringChatMark,
                15, // 每次获取15条消息
                sinceTimestamp
            );
            
            // 处理返回的消息
            if (historyMessages && historyMessages.length > 0) {
                if (loadMore) {
                    // 加载更多时，将新消息插入到列表开头（保持从老到新的顺序）
                    setMessages(prev => [...historyMessages, ...prev]);
                } else {
                    // 首次加载时，直接设置消息列表
                    setMessages(historyMessages);
                }
                
                // 检查是否还有更多消息
                setHasMoreMessages(historyMessages.length === 15);
            } else {
                if (!loadMore) {
                    setMessages([]);
                }
                setHasMoreMessages(false);
            }
            
        } catch (error) {
            console.error('获取消息失败:', error);
            alert('获取聊天记录失败，请检查网络连接');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };
    
    // 加载更多消息（当用户滑动到顶部时调用）
    const loadMoreMessages = () => {
        if (!isLoadingMore && hasMoreMessages) {
            fetchMessages(true);
        }
    };
    
    // 发送消息
    const sendMessage = async () => {
        if (!inputText.trim() || !signalRClient || isSending) return;
        
        try {
            setIsSending(true);
            
            const request: SendMessageRequest = {
                ChatUniqueMark: requiringChatMark || '',
                Content: inputText.trim(), // future using Message
                MessageType: EMessageType.Normal,
                SentTimestamp: Date.now(),
                IsMentioningAll: false
            };
            
            // 通过SignalR发送消息
            await signalRClient.sendMessage(request);
            
            // 关键缺陷未解决：
            const newMessage: Message = {
                traceId: Date.now().toString(),
                content: inputText.trim(),
                info: '',
                senderId: currentUser?.localId || 'currentUser',
                senderName: currentUser?.displayName || '我',
                senderAvatarLocator: '',
                ofChatId: requiringChatMark || '',
                type: EMessageType.Normal,
                sentTimestamp: Date.now(),
            } as Message;
            
            setMessages(prev => [...prev, newMessage]);
            dispatch(addNewMessage(newMessage));
            setInputText('');
            
            // 滚动到底部
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
            
        } catch (error) {
            console.error('发送消息失败:', error);
            alert('发送消息失败，请检查网络连接');
        } finally {
            setIsSending(false);
        }
    };
    
    // 设置SignalR消息接收监听
    useEffect(() => {
        if (!signalRClient) return;
        
        // 监听新消息
        signalRClient.onContactAndMessageUpdated = (contact, message, totalUnreadCount) => {
            if (message.ofChatId === requiringChatMark) {
                setMessages(prev => [...prev, message]);
                dispatch(addNewMessage(message));
                
                // 滚动到底部
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        };
        
        return () => {
            // 清理监听器
            signalRClient.onContactAndMessageUpdated = undefined;
        };
    }, [signalRClient, requiringChatMark]);
    
    // 组件挂载时获取消息
    useEffect(() => {
        if (requiringChatMark) {
            fetchMessages();
        }
    }, [requiringChatMark]);
    
    // 当requiringChatMark变化时重置状态
    useEffect(() => {
        if (requiringChatMark && requiringChatMark !== chatParams?.targetQueryId) {
            setMessages([]);
            setHasMoreMessages(true);
        }
    }, [requiringChatMark, chatParams?.targetQueryId]);
    
    // 渲染消息项
    const renderMessageItem = ({ item }: { item: Message }) => {
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
                    <Text style={styles.messageSender}>
                        {item.senderName}
                    </Text>
                    <Text style={styles.messageContent}>
                        {item.content}
                    </Text>
                    <Text style={styles.messageTime}>
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
            {/* 聊天标题栏 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {requiringChatMark ? '聊天' : '聊天'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {requiringChatMark ? '在线' : '离线'}
                </Text>
            </View>
            
            {/* 消息列表 */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.traceId}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                onContentSizeChange={() => {
                    // 只在首次加载时自动滚动到底部
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
                            <Text style={styles.loadingText}>加载中...</Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>加载聊天记录...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>暂无聊天记录</Text>
                        </View>
                    )
                }
            />
            
            {/* 输入区域 */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="输入消息..."
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
                        {isSending ? '发送中...' : '发送'}
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
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
});