export interface User {
  id?: number;
  user_guid: string;
  username?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  status?: string;
  last_seen?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  public static fromRow(row: any): User {
    return {
      id: row.id,
      user_guid: row.user_guid,
      username: row.username,
      email: row.email,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      status: row.status,
      last_seen: row.last_seen ? new Date(row.last_seen) : undefined,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  public static toRow(user: User): any {
    return {
      user_guid: user.user_guid,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      status: user.status,
      last_seen: user.last_seen?.toISOString(),
      created_at: user.created_at?.toISOString(),
      updated_at: user.updated_at?.toISOString()
    };
  }
}