import { DatabaseManager } from './DatabaseManager';

/**
 * 基于SQLite的存储适配器，用于替换AsyncStorage
 */
export class SQLiteStorageAdapter {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * 初始化存储适配器
   */
  public async initialize(): Promise<void> {
    if (!this.dbManager.isInitialized()) {
      await this.dbManager.initializeDatabase();
    }
  }

  /**
   * 存储用户数据
   */
  public async saveUser(userData: any): Promise<void> {
    await this.dbManager.saveUser({
      user_guid: userData.user_guid || userData.userId,
      username: userData.username,
      email: userData.email,
      display_name: userData.display_name || userData.displayName,
      avatar_url: userData.avatar_url,
      status: userData.status || 'online',
      last_seen: userData.last_seen ? new Date(userData.last_seen) : new Date()
    });
  }

  /**
   * 获取用户数据
   */
  public async getUser(userGuid: string): Promise<any | null> {
    const user = await this.dbManager.getUserByGuid(userGuid);
    if (!user) return null;

    return {
      user_guid: user.user_guid,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      displayName: user.display_name, // 兼容zen-core-chatty-ts的UserInfo格式
      avatar_url: user.avatar_url,
      status: user.status,
      last_seen: user.last_seen,
      userId: user.user_guid // 兼容zen-core-chatty-ts的UserInfo格式
    };
  }

  /**
   * 缓存当前登录用户的个人信息
   */
  public async cacheCurrentUserInfo(userInfo: any): Promise<void> {
    if (!userInfo || !userInfo.userId) {
      console.warn('Invalid user info for caching');
      return;
    }

    try {
      await this.saveUser({
        user_guid: userInfo.userId,
        username: userInfo.username,
        email: userInfo.email,
        display_name: userInfo.displayName,
        status: userInfo.status || 'online',
        last_seen: new Date()
      });
      console.log('User info cached successfully:', userInfo.userId);
    } catch (error) {
      console.error('Failed to cache user info:', error);
    }
  }

  /**
   * 获取缓存的当前用户信息
   */
  public async getCachedCurrentUserInfo(): Promise<any | null> {
    try {
      // 获取最近登录的用户（基于last_seen时间）
      const sql = 'SELECT * FROM users ORDER BY last_seen DESC LIMIT 1';
      const result = await this.dbManager.executeSql(sql, []);
      
      if (result.rows.length > 0) {
        const user = result.rows.item(0);
        return {
          userId: user.user_guid,
          username: user.username,
          displayName: user.display_name,
          email: user.email,
          status: user.status,
          last_seen: user.last_seen
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached user info:', error);
      return null;
    }
  }

  /**
   * 存储认证凭据
   */
  public async saveCredential(credentialData: any): Promise<void> {
    await this.dbManager.saveCredential({
      user_guid: credentialData.user_guid,
      access_token: credentialData.access_token,
      refresh_token: credentialData.refresh_token,
      root_token: credentialData.root_token,
      using_device_id: credentialData.using_device_id,
      expires_at: credentialData.expires_at ? new Date(credentialData.expires_at) : undefined
    });
  }

  /**
   * 获取认证凭据
   */
  public async getCredential(userGuid: string): Promise<any | null> {
    return await this.dbManager.getCredentialByUserGuid(userGuid);
  }

  /**
   * 获取所有认证凭据
   */
  public async getAllCredentials(): Promise<any[]> {
    return await this.dbManager.getAllCredentials();
  }

  /**
   * 删除认证凭据
   */
  public async deleteCredential(userGuid: string): Promise<void> {
    const sql = 'DELETE FROM credentials WHERE user_guid = ?';
    await this.dbManager.executeSql(sql, [userGuid]);
  }

  /**
   * 存储联系人列表
   */
  public async saveContacts(userGuid: string, contacts: any[]): Promise<void> {
    // 先删除该用户的所有联系人
    const deleteSql = 'DELETE FROM contacts WHERE user_guid = ?';
    await this.dbManager.executeSql(deleteSql, [userGuid]);

    // 然后插入新的联系人列表
    for (const contact of contacts) {
      await this.dbManager.saveContact({
        contact_guid: contact.contact_guid || `${userGuid}_${contact.user_guid}`,
        user_guid: userGuid,
        contact_user_guid: contact.user_guid,
        nickname: contact.nickname,
        relationship_status: contact.relationship_status || 'friend',
        is_blocked: contact.is_blocked || false,
        is_favorite: contact.is_favorite || false,
        last_interaction: contact.last_interaction ? new Date(contact.last_interaction) : undefined
      });
    }
  }

  /**
   * 获取联系人列表
   */
  public async getContacts(userGuid: string): Promise<any[]> {
    const contacts = await this.dbManager.getContactsByUserGuid(userGuid);
    return contacts.map(contact => ({
      user_guid: contact.contact_user_guid,
      nickname: contact.nickname,
      relationship_status: contact.relationship_status,
      is_blocked: contact.is_blocked,
      is_favorite: contact.is_favorite,
      last_interaction: contact.last_interaction
    }));
  }

  /**
   * 存储私聊列表
   */
  public async savePrivateChats(userGuid: string, chats: any[]): Promise<void> {
    // 先删除该用户相关的所有私聊记录
    const deleteSql = 'DELETE FROM private_chats WHERE user1_guid = ? OR user2_guid = ?';
    await this.dbManager.executeSql(deleteSql, [userGuid, userGuid]);

    // 然后插入新的私聊列表
    for (const chat of chats) {
      await this.dbManager.savePrivateChat({
        chat_guid: chat.chat_guid,
        user1_guid: chat.user1_guid,
        user2_guid: chat.user2_guid,
        last_message_id: chat.last_message_id,
        last_message_text: chat.last_message_text,
        last_message_timestamp: chat.last_message_timestamp ? new Date(chat.last_message_timestamp) : undefined,
        unread_count: chat.unread_count || 0,
        is_muted: chat.is_muted || false
      });
    }
  }

  /**
   * 获取私聊列表
   */
  public async getPrivateChats(userGuid: string): Promise<any[]> {
    const chats = await this.dbManager.getPrivateChatsByUserGuid(userGuid);
    return chats.map(chat => ({
      chat_guid: chat.chat_guid,
      user1_guid: chat.user1_guid,
      user2_guid: chat.user2_guid,
      last_message_id: chat.last_message_id,
      last_message_text: chat.last_message_text,
      last_message_timestamp: chat.last_message_timestamp,
      unread_count: chat.unread_count,
      is_muted: chat.is_muted,
      contact_display_name: (chat as any).contact_display_name,
      contact_avatar: (chat as any).contact_avatar
    }));
  }

  /**
   * 存储群聊列表
   */
  public async saveGroupChats(userGuid: string, chats: any[]): Promise<void> {
    // 先删除该用户的所有群聊记录
    const deleteSql = 'DELETE FROM group_members WHERE user_guid = ?';
    await this.dbManager.executeSql(deleteSql, [userGuid]);

    // 然后插入新的群聊列表和成员关系
    for (const chat of chats) {
      // 保存群聊信息
      await this.dbManager.saveGroupChat({
        group_guid: chat.group_guid,
        group_name: chat.group_name,
        group_description: chat.group_description,
        group_avatar_url: chat.group_avatar_url,
        owner_guid: chat.owner_guid,
        member_count: chat.member_count || 0,
        last_message_id: chat.last_message_id,
        last_message_text: chat.last_message_text,
        last_message_timestamp: chat.last_message_timestamp ? new Date(chat.last_message_timestamp) : undefined,
        unread_count: chat.unread_count || 0,
        is_muted: chat.is_muted || false
      });

      // 保存该用户的群成员关系
      await this.dbManager.saveGroupMember({
        group_guid: chat.group_guid,
        user_guid: userGuid,
        role: chat.role || 'member',
        nickname: chat.nickname,
        is_muted: chat.is_muted || false
      });
    }
  }

  /**
   * 获取群聊列表
   */
  public async getGroupChats(userGuid: string): Promise<any[]> {
    const chats = await this.dbManager.getGroupChatsByUserGuid(userGuid);
    return chats.map(chat => ({
      group_guid: chat.group_guid,
      group_name: chat.group_name,
      group_description: chat.group_description,
      group_avatar_url: chat.group_avatar_url,
      owner_guid: chat.owner_guid,
      member_count: chat.member_count,
      last_message_id: chat.last_message_id,
      last_message_text: chat.last_message_text,
      last_message_timestamp: chat.last_message_timestamp,
      unread_count: chat.unread_count,
      is_muted: chat.is_muted
    }));
  }

  /**
   * 存储消息
   */
  public async saveMessages(chatGuid: string, messages: any[]): Promise<void> {
    for (const message of messages) {
      await this.dbManager.saveMessage({
        message_guid: message.traceId,
        chat_type: message.ofChat?.type || 'private',
        chat_guid: chatGuid,
        sender_guid: message.senderId,
        message_type: message.type || 'Normal',
        content: message.content,
        info: message.info || '',
        is_mentioning_all: message.isMentioningAll || false,
        is_canceled: message.isCanceled || false,
        is_announcement: message.isAnnouncement || false,
        mentioned_user_guids: message.mentionedUserGuids ? JSON.stringify(message.mentionedUserGuids) : undefined,
        sent_timestamp: message.sentTimestamp || Date.now(),
        server_caught_timestamp: message.serverCaughtTimestamp || Date.now()
      });
    }
  }

  /**
   * 获取消息列表
   */
  public async getMessages(chatGuid: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const messages = await this.dbManager.getMessagesByChatGuid(chatGuid, limit, offset);
    return messages.map(message => ({
      traceId: message.message_guid,
      chat_type: message.chat_type,
      ofChatId: message.chat_guid,
      senderId: message.sender_guid,
      type: message.message_type,
      content: message.content,
      info: message.info,
      isMentioningAll: message.is_mentioning_all,
      isCanceled: message.is_canceled,
      isAnnouncement: message.is_announcement,
      mentionedUserGuids: message.mentioned_user_guids ? JSON.parse(message.mentioned_user_guids) : [],
      sentTimestamp: message.sent_timestamp,
      serverCaughtTimestamp: message.server_caught_timestamp,
      sender_display_name: (message as any).sender_display_name,
      sender_avatar: (message as any).sender_avatar
    }));
  }

  /**
   * 清除所有用户数据
   */
  public async clearAllData(): Promise<void> {
    const tables = ['users', 'contacts', 'private_chats', 'group_chats', 'group_members', 'messages', 'credentials'];
    
    for (const table of tables) {
      await this.dbManager.executeSql(`DELETE FROM ${table}`);
    }
  }

  /**
   * 检查数据库是否已初始化
   */
  public isInitialized(): boolean {
    return this.dbManager.isInitialized();
  }
}