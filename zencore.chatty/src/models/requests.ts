import { EMessageType } from "./enums";

export class CreatePrivateChatRequest {
    public receiverId: string = '';
    public isInformal: boolean = false;
    public displayName?: string;
}

export class UserInfoQueryRequest {
    public email?: string;
    public customId?: string;
}

export class CreateGroupChatRequest {
    public groupName: string = '';
    public description?: string;
    public avatarUrl?: string;
    public allowMemberInvite: boolean = false;
    public requireApproval: boolean = false;
}

export class SendMessageRequest {
    public chatUniqueMark: string = '';
    public sentTimestamp: number = (new Date()).getTime();
    public content: string = '';
    public messageType?: EMessageType;
    public viaGroupChatId?: string;
    public isMentioningAll: boolean = false;
    public mentionedUserIds?: string[];
    public info?: string;
}

export class SendMessageResponse {
    public success: boolean = false;
    public message: string = '';
    public result?: string;
}

export class RecallMessageRequest {
    public messageTraceId: string = '';
    public chatUniqueMark: string = '';
}

export class GroupManagementRequest {
    public groupId: string = '';
    public targetUserId: string = '';
    public reason?: string;
    public silentDuration?: string;
    public newTitle?: string;
}

export class UpdateGroupSettingsRequest {
    public groupId: string = '';
    public displayName?: string;
    public avatarFileLocator?: string;
    public isAllSilent: boolean = false;
    public isInviteOnly: boolean = false;
    public isPrivateChatAllowed: boolean = false;
    public reason?: string;
}

export class GroupInviteLinkRequest {
    public groupId: string = '';
    public expiresAt?: Date;
    public targetUserId?: string;
    public isPublic?: boolean;
}

export class PrivacyCheckRequest {
    public targetUserId: string = '';
    public checkType: string = '';
}

export class UpdateGroupAnnouncementRequest {
    public announcement: string = '';
}

export class FileUploadRequest {
    public file: File = new File([], '');
    public fileExtension: string = '';
    public clientCalculatedSha256: string = '';
}

export class FileUploadResponse {
    public locator: string = '';
    public fileSize: number = 0;
    public uploadTime: Date = new Date();
    public success: boolean = false;
    public message: string = '';
}

export class FileInfoResponse {
    public locator: string = '';
    public fileName: string = '';
    public fileSize: number = 0;
    public mimeType: string = '';
    public uploadTime: Date = new Date();
    public uploaderId: string = '';
    public success: boolean = false;
    public message: string = '';
}