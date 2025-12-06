import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addNewMessage, updateUnreadCount, Message } from 'zen-core-chatty-ts';

/**
 * 自定义Hook，用于监听新消息并自动更新Redux状态
 * @param contactId 联系人ID，用于过滤特定联系人的消息
 * @returns 当前联系人的消息列表和未读计数
 */
export const useMessageListener = (contactId?: string) => {
    const dispatch = useDispatch();
    
    // 从Redux状态获取所有消息
    const allMessages = useSelector((state: RootState) => state.messages.messageList);
    
    // 从Redux状态获取未读计数
    const unreadCounts = useSelector((state: RootState) => state.messages.unreadCounts);
    
    // 根据contactId过滤消息
    const messages = useMemo(() => {
        if (contactId) {
            return allMessages.filter((message: any) => message.contactId === contactId);
        }
        return allMessages;
    }, [allMessages, contactId]);
    
    // 获取特定联系人的未读计数
    const unreadCount = useMemo(() => {
        if (contactId) {
            return (unreadCounts as Record<string, number>)[contactId] || 0;
        }
        // 如果没有指定contactId，返回总未读计数
        return Object.values(unreadCounts as Record<string, number>).reduce((sum: number, count: number) => sum + count, 0);
    }, [unreadCounts, contactId]);
    
    // 本地状态用于存储新接收的消息（可选）
    const [newMessages, setNewMessages] = useState<any[]>([]);
    
    /**
     * 手动添加新消息到Redux状态
     * @param message 新消息对象
     */
    const addMessage = (message: Message) => {
        dispatch(addNewMessage(message));
    };
    
    /**
     * 更新未读计数
     * @param contactId 联系人ID
     * @param count 新的未读计数
     */
    const updateCount = (contactId: string, count: number) => {
        dispatch(updateUnreadCount({ contactId, unreadCount: count }));
    };
    
    // 监听消息变化的副作用（可选）
    useEffect(() => {
        // 可以在这里添加额外的消息处理逻辑
        console.log(`消息监听器已激活，联系人ID: ${contactId || '全部'}`);
        console.log(`当前消息数量: ${messages.length}`);
        console.log(`未读计数: ${unreadCount}`);
        
        return () => {
            console.log(`消息监听器已卸载，联系人ID: ${contactId || '全部'}`);
        };
    }, [contactId, messages.length, unreadCount]);
    
    return {
        messages,
        unreadCount,
        addMessage,
        updateCount,
        newMessages,
        setNewMessages
    };
};

export default useMessageListener;