import { useState, useEffect, useCallback } from 'react';
import { CreateZenCoreClient } from 'zen-core-chatty-ts';
import { DefaultConfig } from '../ZenClient.config';
import { Contact } from 'zen-core-chatty-ts';
import { useCredential } from './useCredential';
import { useDispatch } from 'react-redux';
import { updateContact as updateContactAction, updateRecentContact } from 'zen-core-chatty-ts';

export const useContacts = (signalRClient: any, requiringAll = false) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const credential = useCredential();
    const dispatch = useDispatch();

    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!credential?.AccessToken) {
                setError('未找到有效的访问令牌');
                setLoading(false);
                return;
            }

            const contactApi = CreateZenCoreClient({
                ...DefaultConfig,
                userToken: credential.AccessToken
            }).contact;
            const userContacts = requiringAll ? await contactApi.getContacts() : await contactApi.getRecentContacts();
            console.log('获取到联系人数量:', userContacts.length);

            const sortedContacts = userContacts.sort((a, b) =>
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );

            setContacts(sortedContacts);
        } catch (err) {
            setError('获取联系人失败');
            console.error('获取联系人失败:', err);
        } finally {
            setLoading(false);
        }
    }, [credential?.AccessToken, requiringAll]);

    // 设置SignalR事件监听
    const setupSignalRListeners = useCallback(() => {
        if (!signalRClient) return;

        // 监听联系人更新事件
        signalRClient.onContactAndMessageUpdated = (contact: Contact, message: any, totalUnreadCount: number) => {
            console.log('收到联系人更新:', contact.contactId, contact.displayName);
            
            // 更新Redux状态
            dispatch(updateContactAction(contact));
            
            // 更新本地状态
            setContacts(prev => {
                const index = prev.findIndex(c => c.contactId === contact.contactId);
                if (index === -1) {
                    // 新联系人，添加到列表开头
                    return [contact, ...prev];
                }

                const newContacts = [...prev];
                newContacts[index] = contact;

                // 按最后使用时间重新排序
                return newContacts.sort((a, b) =>
                    new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
                );
            });
        };

        signalRClient.onContactUpdated = (contact: Contact) => {
            console.log('收到联系人信息更新:', contact.contactId);
            
            // 更新Redux状态
            dispatch(updateContactAction(contact));
            
            // 更新本地状态
            setContacts(prev => {
                const index = prev.findIndex(c => c.contactId === contact.contactId);
                if (index === -1) return prev;

                const newContacts = [...prev];
                newContacts[index] = contact;
                return newContacts;
            });
        };

        signalRClient.onUnreadCountUpdated = (contactId: string, unreadCount: number) => {
            console.log('收到未读计数更新:', contactId, unreadCount);
            
            // 更新本地状态
            setContacts(prev => {
                const index = prev.findIndex(c => c.contactId === contactId);
                if (index === -1) return prev;

                const newContacts = [...prev];
                newContacts[index] = {
                    ...newContacts[index],
                    lastUnreadCount: unreadCount,
                    hasVitalUnread: unreadCount > 0
                };

                return newContacts;
            });
        };
    }, [signalRClient, dispatch]);

    useEffect(() => {
        fetchContacts();
        setupSignalRListeners();
    }, [fetchContacts, setupSignalRListeners]);

    // 更新单个联系人的方法
    const updateContact = useCallback((updatedContact: Contact) => {
        // 更新Redux状态
        dispatch(updateContactAction(updatedContact));
        
        setContacts(prev => {
            const index = prev.findIndex(c => c.contactId === updatedContact.contactId);
            if (index === -1) {
                // 如果联系人不存在，添加到列表开头
                return [updatedContact, ...prev];
            }

            // 更新现有联系人
            const newContacts = [...prev];
            newContacts[index] = updatedContact;

            // 按最后使用时间重新排序
            return newContacts.sort((a, b) =>
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );
        });
    }, [dispatch]);

    // 添加新联系人的方法
    const addContact = useCallback((newContact: Contact) => {
        // 更新Redux状态
        dispatch(updateContactAction(newContact));
        
        setContacts(prev => {
            const existingIndex = prev.findIndex(c => c.contactId === newContact.contactId);
            if (existingIndex !== -1) {
                // 如果联系人已存在，更新它
                const updatedContacts = [...prev];
                updatedContacts[existingIndex] = newContact;
                return updatedContacts;
            }

            // 添加新联系人到列表开头
            return [newContact, ...prev];
        });
    }, [dispatch]);

    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        updateContact,
        addContact
    };
};