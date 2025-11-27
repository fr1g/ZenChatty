export interface GroupMember {
  id?: number;
  group_guid: string;
  user_guid: string;
  role: 'owner' | 'admin' | 'member';
  joined_at?: Date;
  nickname?: string;
  is_muted: boolean;
}

export class GroupMemberModel {
  public static fromRow(row: any): GroupMember {
    return {
      id: row.id,
      group_guid: row.group_guid,
      user_guid: row.user_guid,
      role: row.role || 'member',
      joined_at: row.joined_at ? new Date(row.joined_at) : undefined,
      nickname: row.nickname,
      is_muted: Boolean(row.is_muted)
    };
  }

  public static toRow(member: GroupMember): any {
    return {
      group_guid: member.group_guid,
      user_guid: member.user_guid,
      role: member.role,
      joined_at: member.joined_at?.toISOString(),
      nickname: member.nickname,
      is_muted: member.is_muted ? 1 : 0
    };
  }
}