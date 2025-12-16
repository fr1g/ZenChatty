import { SQLiteStorageAdapter } from "../../database/SQLiteStorageAdapter";
import { ClientInitObject, logoutUser, Credential } from "zen-core-chatty-ts";
import { ClientConfig } from "../../App";

/**
 * Utility methods for cleaning up login records
 * Provides complete user data cleanup functionality including credentials, user info, contacts and private chats
 */
export class LogoutHelper {

    /**
     * Execute complete user data cleanup operation
     * @param userGuid User GUID to clean up
     * @param storageAdapter Storage adapter instance
     * @param clientConfig Client configuration
     * @returns Promise<void>
     */
    static async cleanupUserData(
        credential: Credential,
        storageAdapter: SQLiteStorageAdapter,
        clientConfig: ClientInitObject
    ): Promise<void> {
        try {
            // 1. Call SDK logout method
            console.log('Calling SDK logout method...');

            await logoutUser({
                credential,
                clientConfig,
                storageMethod: async (credentialToClear: Credential, wipe: boolean) => {
                    // Delete credentials

                    await storageAdapter.deleteCredential(credentialToClear.UserGuid);
                    console.log('Login credentials deleted from database');

                    // Delete user info
                    const sql = 'DELETE FROM users WHERE user_guid = ?';
                    await storageAdapter['dbManager'].executeSql(sql, [credentialToClear.UserGuid]);
                    console.log('User info deleted from database');

                    // Delete contacts data
                    const deleteContactsSql = 'DELETE FROM contacts WHERE user_guid = ?';
                    await storageAdapter['dbManager'].executeSql(deleteContactsSql, [credentialToClear.UserGuid]);
                    console.log('Contacts data deleted from database');

                    // Delete private chats data
                    const deleteChatsSql = 'DELETE FROM private_chats WHERE user1_guid = ? OR user2_guid = ?';
                    await storageAdapter['dbManager'].executeSql(deleteChatsSql, [credentialToClear.UserGuid, credentialToClear.UserGuid]);
                    console.log('Private chats data deleted from database');
                }
            });
        } catch (error) {
            console.error('Error occurred while cleaning up user data:', error);
            throw error;
        }
    }

    /**
     * Clean up credentials only (simplified cleanup, for auth failure cases)
     * @param userGuid User GUID to clean up
     * @param storageAdapter Storage adapter instance
     * @returns Promise<void>
     */
    static async cleanupCredentialsOnly(
        userGuid: string,
        storageAdapter: SQLiteStorageAdapter
    ): Promise<void> {
        try {
            console.log('Cleaning up invalid credentials...');
            await storageAdapter.deleteCredential(userGuid);
            console.log('Invalid credentials successfully cleared:', userGuid);
        } catch (error) {
            console.error('Failed to clear invalid credentials:', error);
            throw error;
        }
    }
}