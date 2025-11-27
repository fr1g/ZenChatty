export interface Message {
  id?: number;
  message_guid: string;
  chat_guid: string;
  chat_type: 'private' | 'group';
  sender_guid: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;
  is_read: boolean;
  is_delivered: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_message_guid?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class MessageModel {
  public static fromRow(row: any): Message {
    return {
      id: row.id,
      message_guid: row.message_guid,
      chat_guid: row.chat_guid,
      chat_type: row.chat_type,
      sender_guid: row.sender_guid,
      message_type: row.message_type,
      content: row.content,
      file_url: row.file_url,
      file_name: row.file_name,
      file_size: row.file_size,
      thumbnail_url: row.thumbnail_url,
      is_read: Boolean(row.is_read),
      is_delivered: Boolean(row.is_delivered),
      is_edited: Boolean(row.is_edited),
      is_deleted: Boolean(row.is_deleted),
      reply_to_message_guid: row.reply_to_message_guid,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  public static toRow(message: Message): any {
    return {
      message_guid: message.message_guid,
      chat_guid: message.chat_guid,
      chat_type: message.chat_type,
      sender_guid: message.sender_guid,
      message_type: message.message_type,
      content: message.content,
      file_url: message.file_url,
      file_name: message.file_name,
      file_size: message.file_size,
      thumbnail_url: message.thumbnail_url,
      is_read: message.is_read ? 1 : 0,
      is_delivered: message.is_delivered ? 1 : 0,
      is_edited: message.is_edited ? 1 : 0,
      is_deleted: message.is_deleted ? 1 : 0,
      reply_to_message_guid: message.reply_to_message_guid,
      created_at: message.created_at?.toISOString(),
      updated_at: message.updated_at?.toISOString()
    };
  }
}