export interface GroupChat {
  id?: number;
  group_guid: string;
  group_name: string;
  group_description?: string;
  group_avatar_url?: string;
  owner_guid: string;
  member_count: number;
  last_message_id?: number;
  last_message_text?: string;
  last_message_timestamp?: Date;
  unread_count: number;
  is_muted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class GroupChatModel {
  public static fromRow(row: any): GroupChat {
    return {
      id: row.id,
      group_guid: row.group_guid,
      group_name: row.group_name,
      group_description: row.group_description,
      group_avatar_url: row.group_avatar_url,
      owner_guid: row.owner_guid,
      member_count: row.member_count || 0,
      last_message_id: row.last_message_id,
      last_message_text: row.last_message_text,
      last_message_timestamp: row.last_message_timestamp ? new Date(row.last_message_timestamp) : undefined,
      unread_count: row.unread_count || 0,
      is_muted: Boolean(row.is_muted),
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  public static toRow(chat: GroupChat): any {
    return {
      group_guid: chat.group_guid,
      group_name: chat.group_name,
      group_description: chat.group_description,
      group_avatar_url: chat.group_avatar_url,
      owner_guid: chat.owner_guid,
      member_count: chat.member_count,
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