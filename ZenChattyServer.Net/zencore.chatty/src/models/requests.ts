import { EMessageType } from "./enums";

export class CreatePrivateChatRequest {
    public participantUserId: string = '';
}

export class CreateGroupChatRequest {
    public groupName: string = '';
    public description: string = '';
    public initialMemberIds: string[] = [];
}

export class SendMessageRequest {

    public chatId: string = '';
    public content: string = '';
    public messageType: EMessageType = EMessageType.Normal;
    public mentionedUserIds?: string[];
    public isMentioningAll: boolean = false;
    public isAnnouncement: boolean = false;

}

export class RecallMessageRequest {
    public messageId: string = '';
    public chatId: string = '';
}

export class GroupManagementRequest {
    public groupId: string = '';
    public targetUserId: string = '';
    public action: string = '';
}

export class UpdateGroupSettingsRequest {
    public groupId: string = '';
    public groupName?: string;
    public description?: string;
    public allowAnyoneInvite?: boolean;
    public requireApprovalToJoin?: boolean;
    public allowSendMessages?: boolean;
    public allowSendMedia?: boolean;
    public allowSendFiles?: boolean;
}

export class GroupInviteLinkRequest {
    public groupId: string = '';
    public maxUses: number = 0;
    public expiresAt?: Date;
}

export class PrivacyCheckRequest {
    public targetUserId: string = '';
    public checkType: string = '';
}