import { useState, useEffect, useCallback } from 'react';
import { ContactApiClient, CreateZenCoreClient, SignalRClient } from 'zen-core-chatty-ts';
import { DefaultConfig, DefaultConfig as ZenClientConfig } from '../ZenClient.config';
import { Contact } from 'zen-core-chatty-ts';
import { useCredential } from './useCredential';

export const useContacts = (signalRClient: SignalRClient) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const credential = useCredential();

    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const contactApi = CreateZenCoreClient({
                ...DefaultConfig,
                userToken: credential!.AccessToken
            }).contact;
            const userContacts = await contactApi.getContacts();

            const sortedContacts = userContacts.sort((a, b) =>
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );

            setContacts(sortedContacts);
        } catch (err) {
            setError('Failed to get chats');
            console.error('1 获取联系人失败:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始化SignalR客户端
    const initializeSignalR = useCallback(async () => {
        try {
            const client = new SignalRClient(ZenClientConfig.baseURL);

            // 设置SignalR事件处理
            client.onContactAndMessageUpdated = (contact, message, totalUnreadCount) => {
                console.log('收到联系人更新:', contact, message);

                // 更新联系人列表
                setContacts(prev => {
                    const index = prev.findIndex(c => c.contactId === contact.contactId);
                    if (index === -1) {
                        // 新联系人，添加到列表开头
                        return [contact, ...prev];
                    }

                    // 更新现有联系人
                    const newContacts = [...prev];
                    newContacts[index] = contact;

                    // 按最后使用时间重新排序
                    return newContacts.sort((a, b) =>
                        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
                    );
                });
            };

            client.onContactUpdated = (contact) => {
                console.log('收到联系人信息更新:', contact);

                // 更新联系人信息
                setContacts(prev => {
                    const index = prev.findIndex(c => c.contactId === contact.contactId);
                    if (index === -1) return prev;

                    const newContacts = [...prev];
                    newContacts[index] = contact;
                    return newContacts;
                });
            };

            client.onUnreadCountUpdated = (contactId, unreadCount) => {
                console.log('收到未读计数更新:', contactId, unreadCount);

                // 更新未读计数
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

            // setSignalRClient(client);

            // // 尝试建立SignalR连接
            // await client.connect();
            // console.log('SignalR连接成功，开始监听联系人更新');

        } catch (error) {
            console.error('SignalR初始化失败:', error);
            // SignalR连接失败不影响主要功能，继续使用轮询方式
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        initializeSignalR();
    }, [fetchContacts, initializeSignalR]);

    // 单独的清理effect
    useEffect(() => {
        return () => {
            if (signalRClient) {
                signalRClient.disconnect();
            }
        };
    }, [signalRClient]);

    // 更新单个联系人的方法
    const updateContact = useCallback((updatedContact: Contact) => {
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
    }, []);

    // 添加新联系人的方法
    const addContact = useCallback((newContact: Contact) => {
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
    }, []);

    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        updateContact,
        addContact
    };
};