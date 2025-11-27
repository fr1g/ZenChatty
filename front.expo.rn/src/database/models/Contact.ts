export interface Contact {
  id?: number;
  contact_guid: string;
  user_guid: string;
  contact_user_guid: string;
  nickname?: string;
  relationship_status: 'friend' | 'pending' | 'blocked';
  is_blocked: boolean;
  is_favorite: boolean;
  last_interaction?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class ContactModel {
  public static fromRow(row: any): Contact {
    return {
      id: row.id,
      contact_guid: row.contact_guid,
      user_guid: row.user_guid,
      contact_user_guid: row.contact_user_guid,
      nickname: row.nickname,
      relationship_status: row.relationship_status || 'friend',
      is_blocked: Boolean(row.is_blocked),
      is_favorite: Boolean(row.is_favorite),
      last_interaction: row.last_interaction ? new Date(row.last_interaction) : undefined,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  public static toRow(contact: Contact): any {
    return {
      contact_guid: contact.contact_guid,
      user_guid: contact.user_guid,
      contact_user_guid: contact.contact_user_guid,
      nickname: contact.nickname,
      relationship_status: contact.relationship_status,
      is_blocked: contact.is_blocked ? 1 : 0,
      is_favorite: contact.is_favorite ? 1 : 0,
      last_interaction: contact.last_interaction?.toISOString(),
      created_at: contact.created_at?.toISOString(),
      updated_at: contact.updated_at?.toISOString()
    };
  }
}