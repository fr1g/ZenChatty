import { EChatStatus, EGroupMemberType } from './enums';
import { User } from './user';
import { Message } from './message';
/**
 * 聊天基础类
 */
export declare class Chat {
    [x: string]: any;
    uniqueMark: string | undefined;
    initBy: User;
    history: any[];
    status: EChatStatus;
    constructor(initBy: User, history?: any[], uniqueMark?: string | undefined, status?: EChatStatus);
}
export declare class PrivateChat extends Chat {
    isInformal: boolean;
    receiver: User;
    constructor(initBy: User, receiver: User, isInformal?: boolean);
}
export declare class GroupChat extends Chat {
    members: GroupChatMember[];
    settings: GroupSettings;
    groupAnnounce: Message[];
    constructor(initBy: User, members: GroupChatMember[], settings?: GroupSettings, groupAnnounce?: Message[]);
}
export declare class GroupSettings {
    displayName: string;
    avatarFileLocator: string | null;
    isAllSilent: boolean;
    isInviteOnly: boolean;
    isPrivateChatAllowed: boolean;
    constructor(displayName?: string, avatarFileLocator?: string | null, isAllSilent?: boolean, isInviteOnly?: boolean, isPrivateChatAllowed?: boolean);
}
/**
 * 群组成员类
 */
export declare class GroupChatMember {
    theGuy: User;
    type: EGroupMemberType;
    givenTitle: string | null;
    nickname: string;
    isSilent: boolean;
    joinedAt: Date;
    silentUntil: Date | null;
    constructor(member: User, type?: EGroupMemberType, givenTitle?: string | null, nickname?: string, isSilent?: boolean, joinedAt?: Date, silentUntil?: Date | null);
}
/**
 * 聊天响应类
 */
export declare class ChatResponse {
    chatId: string;
    chatType: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: Date;
    unreadCount: number;
    lastActivity: Date;
    isBlocked: boolean;
    isPinned: boolean;
    lastMessagePreview?: string;
}
//# sourceMappingURL=chat.d.ts.map