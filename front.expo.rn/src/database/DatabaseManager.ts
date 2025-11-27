import * as SQLite from 'expo-sqlite';

// Import models
import { User, UserModel } from './models/User';
import { Contact, ContactModel } from './models/Contact';
import { PrivateChat, PrivateChatModel } from './models/PrivateChat';
import { GroupChat, GroupChatModel } from './models/GroupChat';
import { GroupMember, GroupMemberModel } from './models/GroupMember';
import { Message, MessageModel } from './models/Message';

export interface DatabaseResult {
  insertId?: number;
  rowsAffected: number;
  rows: {
    _array: any[];
    length: number;
    item: (index: number) => any;
  };
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private databaseName = 'ZenChatty.db';

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库
   */
  public async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.databaseName);
      console.log('SQLite database opened successfully');
      
      // 创建所有必要的表
      await this.createTables();
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * 创建所有必要的表
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 创建用户表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_guid TEXT UNIQUE NOT NULL,
        username TEXT,
        email TEXT,
        display_name TEXT,
        avatar_url TEXT,
        status TEXT,
        last_seen DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建联系人表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_guid TEXT UNIQUE NOT NULL,
        user_guid TEXT NOT NULL,
        contact_user_guid TEXT NOT NULL,
        nickname TEXT,
        relationship_status TEXT DEFAULT 'friend',
        is_blocked BOOLEAN DEFAULT 0,
        is_favorite BOOLEAN DEFAULT 0,
        last_interaction DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_guid) REFERENCES users (user_guid),
        FOREIGN KEY (contact_user_guid) REFERENCES users (user_guid)
      )
    `);

    // 创建私聊表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS private_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_guid TEXT UNIQUE NOT NULL,
        user1_guid TEXT NOT NULL,
        user2_guid TEXT NOT NULL,
        last_message_id INTEGER,
        last_message_text TEXT,
        last_message_timestamp DATETIME,
        unread_count INTEGER DEFAULT 0,
        is_muted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_guid) REFERENCES users (user_guid),
        FOREIGN KEY (user2_guid) REFERENCES users (user_guid)
      )
    `);

    // 创建群聊表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS group_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_guid TEXT UNIQUE NOT NULL,
        group_name TEXT NOT NULL,
        group_description TEXT,
        group_avatar_url TEXT,
        owner_guid TEXT NOT NULL,
        member_count INTEGER DEFAULT 0,
        last_message_id INTEGER,
        last_message_text TEXT,
        last_message_timestamp DATETIME,
        unread_count INTEGER DEFAULT 0,
        is_muted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_guid) REFERENCES users (user_guid)
      )
    `);

    // 创建群聊成员表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_guid TEXT NOT NULL,
        user_guid TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        nickname TEXT,
        is_muted BOOLEAN DEFAULT 0,
        FOREIGN KEY (group_guid) REFERENCES group_chats (group_guid),
        FOREIGN KEY (user_guid) REFERENCES users (user_guid),
        UNIQUE(group_guid, user_guid)
      )
    `);

    // 创建消息表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_guid TEXT UNIQUE NOT NULL,
        chat_type TEXT NOT NULL, -- 'private' or 'group'
        chat_guid TEXT NOT NULL, -- private_chat_guid or group_guid
        sender_guid TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        content TEXT,
        media_url TEXT,
        file_name TEXT,
        file_size INTEGER,
        is_edited BOOLEAN DEFAULT 0,
        edited_at DATETIME,
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at DATETIME,
        reply_to_message_guid TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME,
        read_at DATETIME,
        FOREIGN KEY (sender_guid) REFERENCES users (user_guid),
        FOREIGN KEY (reply_to_message_guid) REFERENCES messages (message_guid)
      )
    `);

    // 创建认证凭据表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_guid TEXT UNIQUE NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        root_token TEXT,
        using_device_id TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_guid) REFERENCES users (user_guid)
      )
    `);

    // 创建索引以提高查询性能
    await this.createIndexes();
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 用户表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_users_guid ON users(user_guid)');
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

    // 联系人表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_contacts_user_guid ON contacts(user_guid)');
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_contacts_contact_guid ON contacts(contact_user_guid)');

    // 私聊表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON private_chats(user1_guid)');
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON private_chats(user2_guid)');

    // 群聊表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_group_chats_owner ON group_chats(owner_guid)');

    // 群聊成员表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_guid)');
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_guid)');

    // 消息表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_guid, chat_type)');
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_guid)');
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(sent_at)');

    // 凭据表索引
    await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_guid)');
  }

  /**
   * 执行SQL查询
   */
  public async executeSql(sql: string, params: any[] = []): Promise<DatabaseResult> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.runAsync(sql, params);
      return {
        insertId: result.lastInsertRowId as number,
        rowsAffected: result.changes,
        rows: {
          _array: [],
          length: 0,
          item: () => null
        }
      };
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  /**
   * 执行SQL查询并返回结果
   */
  public async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(sql, params);
      return result;
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  public async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database closed successfully');
    }
  }

  /**
   * 获取数据库实例
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * 检查数据库是否已初始化
   */
  public isInitialized(): boolean {
    return this.db !== null;
  }

  // User operations
  public async saveUser(user: User): Promise<number> {
    const sql = `INSERT OR REPLACE INTO users 
      (user_guid, username, email, display_name, avatar_url, status, last_seen, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    
    const result = await this.executeSql(sql, [
      user.user_guid, user.username, user.email, user.display_name, 
      user.avatar_url, user.status, user.last_seen?.toISOString()
    ]);
    
    return result.insertId || 0;
  }

  public async getUserByGuid(userGuid: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE user_guid = ?';
    const rows = await this.query(sql, [userGuid]);
    return rows.length > 0 ? UserModel.fromRow(rows[0]) : null;
  }

  public async getAllUsers(): Promise<User[]> {
    const sql = 'SELECT * FROM users ORDER BY display_name, username';
    const rows = await this.query(sql);
    return rows.map(row => UserModel.fromRow(row));
  }

  // Contact operations
  public async saveContact(contact: Contact): Promise<number> {
    const sql = `INSERT OR REPLACE INTO contacts 
      (contact_guid, user_guid, contact_user_guid, nickname, relationship_status, 
       is_blocked, is_favorite, last_interaction, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    
    const result = await this.executeSql(sql, [
      contact.contact_guid, contact.user_guid, contact.contact_user_guid,
      contact.nickname, contact.relationship_status, 
      contact.is_blocked ? 1 : 0, contact.is_favorite ? 1 : 0,
      contact.last_interaction?.toISOString()
    ]);
    
    return result.insertId || 0;
  }

  public async getContactsByUserGuid(userGuid: string): Promise<Contact[]> {
    const sql = `SELECT c.*, u.username, u.display_name, u.avatar_url, u.status
                 FROM contacts c
                 JOIN users u ON c.contact_user_guid = u.user_guid
                 WHERE c.user_guid = ?
                 ORDER BY c.is_favorite DESC, c.nickname, u.display_name`;
    const rows = await this.query(sql, [userGuid]);
    return rows.map(row => ContactModel.fromRow(row));
  }

  // Message operations
  public async saveMessage(message: Message): Promise<number> {
    const sql = `INSERT INTO messages 
      (message_guid, chat_type, chat_guid, sender_guid, message_type, content,
       media_url, file_name, file_size, is_edited, is_deleted, reply_to_message_guid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await this.executeSql(sql, [
      message.message_guid, message.chat_type, message.chat_guid, message.sender_guid,
      message.message_type, message.content, message.media_url, message.file_name,
      message.file_size, message.is_edited ? 1 : 0, message.is_deleted ? 1 : 0,
      message.reply_to_message_guid
    ]);
    
    return result.insertId || 0;
  }

  public async getMessagesByChatGuid(chatGuid: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const sql = `SELECT m.*, u.display_name as sender_display_name, u.avatar_url as sender_avatar
                 FROM messages m
                 JOIN users u ON m.sender_guid = u.user_guid
                 WHERE m.chat_guid = ? AND m.is_deleted = 0
                 ORDER BY m.sent_at DESC
                 LIMIT ? OFFSET ?`;
    const rows = await this.query(sql, [chatGuid, limit, offset]);
    return rows.map(row => MessageModel.fromRow(row));
  }

  // Credential operations
  public async saveCredential(credential: any): Promise<number> {
    const sql = `INSERT OR REPLACE INTO credentials 
      (user_guid, access_token, refresh_token, root_token, using_device_id, expires_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    
    const result = await this.executeSql(sql, [
      credential.user_guid, credential.access_token, credential.refresh_token,
      credential.root_token, credential.using_device_id, credential.expires_at?.toISOString()
    ]);
    
    return result.insertId || 0;
  }

  public async getCredentialByUserGuid(userGuid: string): Promise<any | null> {
    const sql = 'SELECT * FROM credentials WHERE user_guid = ?';
    const rows = await this.query(sql, [userGuid]);
    return rows.length > 0 ? rows[0] : null;
  }

  // PrivateChat operations
  public async savePrivateChat(chat: PrivateChat): Promise<number> {
    const sql = `INSERT OR REPLACE INTO private_chats 
      (chat_guid, user1_guid, user2_guid, last_message_id, last_message_text, 
       last_message_timestamp, unread_count, is_muted, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    
    const result = await this.executeSql(sql, [
      chat.chat_guid, chat.user1_guid, chat.user2_guid, chat.last_message_id,
      chat.last_message_text, chat.last_message_timestamp?.toISOString(),
      chat.unread_count, chat.is_muted ? 1 : 0
    ]);
    
    return result.insertId || 0;
  }

  public async getPrivateChatByGuid(chatGuid: string): Promise<PrivateChat | null> {
    const sql = 'SELECT * FROM private_chats WHERE chat_guid = ?';
    const rows = await this.query(sql, [chatGuid]);
    return rows.length > 0 ? PrivateChatModel.fromRow(rows[0]) : null;
  }

  public async getPrivateChatsByUserGuid(userGuid: string): Promise<PrivateChat[]> {
    const sql = `SELECT pc.*, 
                  CASE 
                    WHEN pc.user1_guid = ? THEN u2.display_name
                    ELSE u1.display_name
                  END as contact_display_name,
                  CASE 
                    WHEN pc.user1_guid = ? THEN u2.avatar_url
                    ELSE u1.avatar_url
                  END as contact_avatar
                 FROM private_chats pc
                 JOIN users u1 ON pc.user1_guid = u1.user_guid
                 JOIN users u2 ON pc.user2_guid = u2.user_guid
                 WHERE pc.user1_guid = ? OR pc.user2_guid = ?
                 ORDER BY pc.last_message_timestamp DESC`;
    const rows = await this.query(sql, [userGuid, userGuid, userGuid, userGuid]);
    return rows.map(row => PrivateChatModel.fromRow(row));
  }

  // GroupChat operations
  public async saveGroupChat(chat: GroupChat): Promise<number> {
    const sql = `INSERT OR REPLACE INTO group_chats 
      (group_guid, group_name, group_description, group_avatar_url, owner_guid,
       member_count, last_message_id, last_message_text, last_message_timestamp,
       unread_count, is_muted, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    
    const result = await this.executeSql(sql, [
      chat.group_guid, chat.group_name, chat.group_description, chat.group_avatar_url,
      chat.owner_guid, chat.member_count, chat.last_message_id, chat.last_message_text,
      chat.last_message_timestamp?.toISOString(), chat.unread_count, chat.is_muted ? 1 : 0
    ]);
    
    return result.insertId || 0;
  }

  public async getGroupChatByGuid(groupGuid: string): Promise<GroupChat | null> {
    const sql = 'SELECT * FROM group_chats WHERE group_guid = ?';
    const rows = await this.query(sql, [groupGuid]);
    return rows.length > 0 ? GroupChatModel.fromRow(rows[0]) : null;
  }

  public async getGroupChatsByUserGuid(userGuid: string): Promise<GroupChat[]> {
    const sql = `SELECT gc.* 
                 FROM group_chats gc
                 JOIN group_members gm ON gc.group_guid = gm.group_guid
                 WHERE gm.user_guid = ?
                 ORDER BY gc.last_message_timestamp DESC`;
    const rows = await this.query(sql, [userGuid]);
    return rows.map(row => GroupChatModel.fromRow(row));
  }

  // GroupMember operations
  public async saveGroupMember(member: GroupMember): Promise<number> {
    const sql = `INSERT OR REPLACE INTO group_members 
      (group_guid, user_guid, role, nickname, is_muted)
      VALUES (?, ?, ?, ?, ?)`;
    
    const result = await this.executeSql(sql, [
      member.group_guid, member.user_guid, member.role, member.nickname, member.is_muted ? 1 : 0
    ]);
    
    return result.insertId || 0;
  }

  public async getGroupMembersByGroupGuid(groupGuid: string): Promise<GroupMember[]> {
    const sql = `SELECT gm.*, u.display_name, u.avatar_url, u.status
                 FROM group_members gm
                 JOIN users u ON gm.user_guid = u.user_guid
                 WHERE gm.group_guid = ?
                 ORDER BY 
                   CASE gm.role 
                     WHEN 'owner' THEN 1
                     WHEN 'admin' THEN 2
                     ELSE 3
                   END, gm.joined_at`;
    const rows = await this.query(sql, [groupGuid]);
    return rows.map(row => GroupMemberModel.fromRow(row));
  }

  public async getGroupMember(groupGuid: string, userGuid: string): Promise<GroupMember | null> {
    const sql = 'SELECT * FROM group_members WHERE group_guid = ? AND user_guid = ?';
    const rows = await this.query(sql, [groupGuid, userGuid]);
    return rows.length > 0 ? GroupMemberModel.fromRow(rows[0]) : null;
  }

  public async removeGroupMember(groupGuid: string, userGuid: string): Promise<boolean> {
    const sql = 'DELETE FROM group_members WHERE group_guid = ? AND user_guid = ?';
    const result = await this.executeSql(sql, [groupGuid, userGuid]);
    return result.rowsAffected > 0;
  }
}