export interface FriendRequest {
  id?: number;
  request_guid: string;
  requester_guid: string;
  receiver_guid: string;
  message_guid?: string;
  via_group_guid?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  request_message?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class FriendRequestModel {
  public static fromRow(row: any): FriendRequest {
    return {
      id: row.id,
      request_guid: row.request_guid,
      requester_guid: row.requester_guid,
      receiver_guid: row.receiver_guid,
      message_guid: row.message_guid,
      via_group_guid: row.via_group_guid,
      status: row.status,
      request_message: row.request_message,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  public static toRow(request: FriendRequest): any {
    return {
      request_guid: request.request_guid,
      requester_guid: request.requester_guid,
      receiver_guid: request.receiver_guid,
      message_guid: request.message_guid || null,
      via_group_guid: request.via_group_guid || null,
      status: request.status,
      request_message: request.request_message || null,
      created_at: request.created_at?.toISOString(),
      updated_at: request.updated_at?.toISOString()
    };
  }
}

