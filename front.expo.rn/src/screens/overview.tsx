import { Alert, FlatList, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Contact, EMessageType, ImageActs, Message } from 'zen-core-chatty-ts';
import ListItem, { ListItemProps } from 'components/ListItem';
import { useContext, useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { SignalRContext } from 'App';

export default function Overview() {
    const signalRClient = useContext(SignalRContext)
    const dispatch = useDispatch();
    
    // 从Redux store中获取联系人数据
    const contacts = useSelector((state: RootState) => state.contacts.recentContactList);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 格式化最后消息时间
    const formatLastMessageTime = (timestamp?: number) => {
        if (!timestamp) return "notime";

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString('zh-CN', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        }
    };

    // 获取消息预览
    const getMessagePreview = (contact: Contact) => {
        if (!contact.object?.history?.[0]) return "No msg";

        const lastMessage = contact.object.history[0] as Message;
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
        return {
            avatarUrl: ImageActs.getContactChatAvatarAsUrl(contact),
            title: contact.displayName ?? "unknown",
            subtitle: getMessagePreview(contact),
            topBadge: contact.lastUnreadCount > 0 ? `${contact.lastUnreadCount}` : undefined,
            CIA: contact.isPinned ? (<Feather name="map-pin" size={16} color="#007AFF" />) : undefined,
            cornerTip: formatLastMessageTime(contact.object?.history?.[0]?.sentTimestamp),
            highlight: contact.hasVitalUnread
        } as ListItemProps;
    };

    // 数据获取逻辑
    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 这里可以添加API调用逻辑来获取联系人数据
            // 暂时使用现有的Redux状态
            console.log('当前联系人数量:', contacts.length);
        } catch (err) {
            setError('获取联系人失败');
            console.error('获取联系人失败:', err);
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时获取数据
    useEffect(() => {
        fetchContacts();
    }, []);

    // 处理错误状态
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

    // 处理加载状态
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
                    <ListItem item={transformContactItem(item)} />
                )}
                keyExtractor={(item) => item.contactId}
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