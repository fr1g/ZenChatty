import { EMessageType } from "./enums";
export declare class CreatePrivateChatRequest {
    participantUserId: string;
}
export declare class CreateGroupChatRequest {
    groupName: string;
    description: string;
    initialMemberIds: string[];
}
export declare class SendMessageRequest {
    chatId: string;
    content: string;
    messageType: EMessageType;
    mentionedUserIds?: string[];
    isMentioningAll: boolean;
    isAnnouncement: boolean;
}
export declare class RecallMessageRequest {
    messageId: string;
    chatId: string;
}
export declare class GroupManagementRequest {
    groupId: string;
    targetUserId: string;
    action: string;
}
export declare class UpdateGroupSettingsRequest {
    groupId: string;
    groupName?: string;
    description?: string;
    allowAnyoneInvite?: boolean;
    requireApprovalToJoin?: boolean;
    allowSendMessages?: boolean;
    allowSendMedia?: boolean;
    allowSendFiles?: boolean;
}
export declare class GroupInviteLinkRequest {
    groupId: string;
    maxUses: number;
    expiresAt?: Date;
}
export declare class PrivacyCheckRequest {
    targetUserId: string;
    checkType: string;
}
//# sourceMappingURL=requests.d.ts.map