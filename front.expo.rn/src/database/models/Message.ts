// 导入SDK中的消息类型枚举
import { EMessageType } from "zen-core-chatty-ts";

export interface Message {
  id?: number;
  message_guid: string; // SDK中的traceId
  chat_guid: string; // SDK中的ofChatId
  chat_type: 'private' | 'group';
  sender_guid: string; // SDK中的senderId
  message_type: EMessageType; // SDK中的type
  content: string;
  info?: string; // SDK中的附加信息
  is_mentioning_all: boolean; // SDK中的isMentioningAll
  is_canceled: boolean; // SDK中的isCanceled
  is_announcement: boolean; // SDK中的isAnnouncement
  mentioned_user_guids?: string; // SDK中的mentionedUserGuids（JSON字符串）
  sent_timestamp: number; // SDK中的sentTimestamp
  server_caught_timestamp: number; // SDK中的serverCaughtTimestamp
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
      info: row.info,
      is_mentioning_all: Boolean(row.is_mentioning_all),
      is_canceled: Boolean(row.is_canceled),
      is_announcement: Boolean(row.is_announcement),
      mentioned_user_guids: row.mentioned_user_guids,
      sent_timestamp: row.sent_timestamp || Date.now(),
      server_caught_timestamp: row.server_caught_timestamp || Date.now(),
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
      info: message.info || '',
      is_mentioning_all: message.is_mentioning_all ? 1 : 0,
      is_canceled: message.is_canceled ? 1 : 0,
      is_announcement: message.is_announcement ? 1 : 0,
      mentioned_user_guids: message.mentioned_user_guids || null,
      sent_timestamp: message.sent_timestamp,
      server_caught_timestamp: message.server_caught_timestamp,
      created_at: message.created_at?.toISOString(),
      updated_at: message.updated_at?.toISOString()
    };
  }
}