import { SQLiteStorageAdapter } from "../../database/SQLiteStorageAdapter";
import { ClientInitObject, logoutUser, Credential } from "zen-core-chatty-ts";
import { ClientConfig } from "../../App";

/**
 * 清理登录记录的工具方法
 * 提供完整的用户数据清理功能，包括凭据、用户信息、联系人数据和私聊记录
 */
export class LogoutHelper {

    /**
     * 执行完整的用户数据清理操作
     * @param userGuid 要清理的用户GUID
     * @param storageAdapter 存储适配器实例
     * @param clientConfig 客户端配置
     * @returns Promise<void>
     */
    static async cleanupUserData(
        credential: Credential,
        storageAdapter: SQLiteStorageAdapter,
        clientConfig: ClientInitObject
    ): Promise<void> {
        try {
            // 1. 调用SDK的退出登录方法
            console.log('调用SDK退出登录方法...');

            await logoutUser({
                credential,
                clientConfig,
                storageMethod: async (credentialToClear: Credential, wipe: boolean) => {
                    // 删除凭证

                    await storageAdapter.deleteCredential(credentialToClear.UserGuid);
                    console.log('登录凭证已从数据库删除');

                    // 删除用户信息
                    const sql = 'DELETE FROM users WHERE user_guid = ?';
                    await storageAdapter['dbManager'].executeSql(sql, [credentialToClear.UserGuid]);
                    console.log('用户信息已从数据库删除');

                    // 删除联系人数据
                    const deleteContactsSql = 'DELETE FROM contacts WHERE user_guid = ?';
                    await storageAdapter['dbManager'].executeSql(deleteContactsSql, [credentialToClear.UserGuid]);
                    console.log('联系人数据已从数据库删除');

                    // 删除私聊数据
                    const deleteChatsSql = 'DELETE FROM private_chats WHERE user1_guid = ? OR user2_guid = ?';
                    await storageAdapter['dbManager'].executeSql(deleteChatsSql, [credentialToClear.UserGuid, credentialToClear.UserGuid]);
                    console.log('私聊数据已从数据库删除');
                }
            });
        } catch (error) {
            console.error('清理用户数据时发生错误:', error);
            throw error;
        }
    }

    /**
     * 仅清理凭据记录（简化版清理，适用于认证失败等情况）
     * @param userGuid 要清理的用户GUID
     * @param storageAdapter 存储适配器实例
     * @returns Promise<void>
     */
    static async cleanupCredentialsOnly(
        userGuid: string,
        storageAdapter: SQLiteStorageAdapter
    ): Promise<void> {
        try {
            console.log('清理无效凭据...');
            await storageAdapter.deleteCredential(userGuid);
            console.log('无效凭据已成功清除:', userGuid);
        } catch (error) {
            console.error('清除无效凭据失败:', error);
            throw error;
        }
    }
}