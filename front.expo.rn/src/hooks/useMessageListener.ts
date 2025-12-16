import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addNewMessage, updateUnreadCount, Message } from 'zen-core-chatty-ts';

/**
 * Custom Hook for listening to new messages and auto-updating Redux state
 * @param contactId Contact ID for filtering messages for specific contact
 * @returns Message list and unread count for current contact
 */
export const useMessageListener = (contactId?: string) => {
    const dispatch = useDispatch();
    
    // Get all messages from Redux state
    const allMessages = useSelector((state: RootState) => state.messages.messageList);
    
    // Get unread counts from Redux state
    const unreadCounts = useSelector((state: RootState) => state.messages.unreadCounts);
    
    // Filter messages by contactId
    const messages = useMemo(() => {
        if (contactId) {
            return allMessages.filter((message: any) => message.contactId === contactId);
        }
        return allMessages;
    }, [allMessages, contactId]);
    
    // Get unread count for specific contact
    const unreadCount = useMemo(() => {
        if (contactId) {
            return (unreadCounts as Record<string, number>)[contactId] || 0;
        }
        // If no contactId specified, return total unread count
        return Object.values(unreadCounts as Record<string, number>).reduce((sum: number, count: number) => sum + count, 0);
    }, [unreadCounts, contactId]);
    
    // Local state for storing newly received messages (optional)
    const [newMessages, setNewMessages] = useState<any[]>([]);
    
    /**
     * Manually add new message to Redux state
     * @param message New message object
     */
    const addMessage = (message: Message) => {
        dispatch(addNewMessage(message));
    };
    
    /**
     * Update unread count
     * @param contactId Contact ID
     * @param count New unread count
     */
    const updateCount = (contactId: string, count: number) => {
        dispatch(updateUnreadCount({ contactId, unreadCount: count }));
    };
    
    // Side effect for listening to message changes (optional)
    useEffect(() => {
        // Can add additional message processing logic here
        console.log(`Message listener activated, contact ID: ${contactId || 'all'}`);
        console.log(`Current message count: ${messages.length}`);
        console.log(`Unread count: ${unreadCount}`);
        
        return () => {
            console.log(`Message listener unmounted, contact ID: ${contactId || 'all'}`);
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