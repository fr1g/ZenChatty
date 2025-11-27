export interface PrivateChat {
  id?: number;
  chat_guid: string;
  user1_guid: string;
  user2_guid: string;
  last_message_id?: number;
  last_message_text?: string;
  last_message_timestamp?: Date;
  unread_count: number;
  is_muted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class PrivateChatModel {
  public static fromRow(row: any): PrivateChat {
    return {
      id: row.id,
      chat_guid: row.chat_guid,
      user1_guid: row.user1_guid,
      user2_guid: row.user2_guid,
      last_message_id: row.last_message_id,
      last_message_text: row.last_message_text,
      last_message_timestamp: row.last_message_timestamp ? new Date(row.last_message_timestamp) : undefined,
      unread_count: row.unread_count || 0,
      is_muted: Boolean(row.is_muted),
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  public static toRow(chat: PrivateChat): any {
    return {
      chat_guid: chat.chat_guid,
      user1_guid: chat.user1_guid,
      user2_guid: chat.user2_guid,
      last_message_id: chat.last_message_id,
      last_message_text: chat.last_message_text,
      last_message_timestamp: chat.last_message_timestamp?.toISOString(),
      unread_count: chat.unread_count,
      is_muted: chat.is_muted ? 1 : 0,
      created_at: chat.created_at?.toISOString(),
      updated_at: chat.updated_at?.toISOString()
    };
  }
}