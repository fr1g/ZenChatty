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
                setError('No valid access token found');
                setLoading(false);
                return;
            }

            const contactApi = CreateZenCoreClient({
                ...DefaultConfig,
                userToken: credential.AccessToken
            }).contact;
            const userContacts = requiringAll ? await contactApi.getContacts() : await contactApi.getRecentContacts();
            console.log('Fetched contacts count:', userContacts.length);

            const sortedContacts = userContacts.sort((a, b) =>
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );

            setContacts(sortedContacts);
        } catch (err) {
            setError('Failed to fetch contacts');
            console.error('Failed to fetch contacts:', err);
        } finally {
            setLoading(false);
        }
    }, [credential?.AccessToken, requiringAll]);

    // Set up SignalR event listeners
    const setupSignalRListeners = useCallback(() => {
        if (!signalRClient) return;

        // Listen for contact update events
        signalRClient.onContactAndMessageUpdated = (contact: Contact, message: any, totalUnreadCount: number) => {
            console.log('Received contact update:', contact.contactId, contact.displayName);
            
            // Update Redux state
            dispatch(updateContactAction(contact));
            
            // Update local state
            setContacts(prev => {
                const index = prev.findIndex(c => c.contactId === contact.contactId);
                if (index === -1) {
                    // New contact, add to list start
                    return [contact, ...prev];
                }

                const newContacts = [...prev];
                newContacts[index] = contact;

                // Re-sort by last used time
                return newContacts.sort((a, b) =>
                    new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
                );
            });
        };

        signalRClient.onContactUpdated = (contact: Contact) => {
            console.log('Received contact info update:', contact.contactId);
            
            // Update Redux state
            dispatch(updateContactAction(contact));
            
            // Update local state
            setContacts(prev => {
                const index = prev.findIndex(c => c.contactId === contact.contactId);
                if (index === -1) return prev;

                const newContacts = [...prev];
                newContacts[index] = contact;
                return newContacts;
            });
        };

        signalRClient.onUnreadCountUpdated = (contactId: string, unreadCount: number) => {
            console.log('Received unread count update:', contactId, unreadCount);
            
            // Update local state
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

    // Method to update single contact
    const updateContact = useCallback((updatedContact: Contact) => {
        // Update Redux state
        dispatch(updateContactAction(updatedContact));
        
        setContacts(prev => {
            const index = prev.findIndex(c => c.contactId === updatedContact.contactId);
            if (index === -1) {
                // If contact doesn't exist, add to list start
                return [updatedContact, ...prev];
            }

            // Update existing contact
            const newContacts = [...prev];
            newContacts[index] = updatedContact;

            // Re-sort by last used time
            return newContacts.sort((a, b) =>
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );
        });
    }, [dispatch]);

    // Method to add new contact
    const addContact = useCallback((newContact: Contact) => {
        // Update Redux state
        dispatch(updateContactAction(newContact));
        
        setContacts(prev => {
            const existingIndex = prev.findIndex(c => c.contactId === newContact.contactId);
            if (existingIndex !== -1) {
                // If contact already exists, update it
                const updatedContacts = [...prev];
                updatedContacts[existingIndex] = newContact;
                return updatedContacts;
            }

            // Add new contact to list start
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