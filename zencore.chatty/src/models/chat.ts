import { EChatStatus, EGroupMemberType } from './enums';
import { User } from './user';
import { Message } from './message';

/**
 * 聊天基础类
 */
export class Chat {

    [x: string]: any; // only

    uniqueMark: string | undefined;
    initById: string = "";
    initiatorAvatarLocator: string = "";
    initiatorName: string = ""

    history: Message[] = [];
    status: EChatStatus = EChatStatus.Normal;

}

export class PrivateChat extends Chat {
    isInformal: boolean = true;
    receiverId: string = "";
    receiverAvatarLocator: string = "";
    receiverName: string = ""
}

export class GroupChat extends Chat {
    members: GroupChatMember[] = [];
    settings?: GroupSettings;
    groupAnnounce: Message[] = [];

}

export class GroupSettings {
    displayName: string;
    avatarFileLocator: string | null;
    isAllSilent: boolean;
    isInviteOnly: boolean; // invite link, QR code with expiration 
    isPrivateChatAllowed: boolean;

    constructor(
        displayName: string = "Group",
        avatarFileLocator: string | null = null,
        isAllSilent: boolean = false,
        isInviteOnly: boolean = false,
        isPrivateChatAllowed: boolean = false
    ) {
        this.displayName = displayName;
        this.avatarFileLocator = avatarFileLocator;
        this.isAllSilent = isAllSilent;
        this.isInviteOnly = isInviteOnly
        this.isPrivateChatAllowed = isPrivateChatAllowed;
    }
}

/**
 * 群组成员类
 */
export class GroupChatMember {
    theGuy: User;
    type: EGroupMemberType;
    givenTitle: string | null;
    nickname: string;
    isSilent: boolean;
    joinedAt: Date;
    silentUntil: Date | null;

    constructor(
        member: User,
        type: EGroupMemberType = EGroupMemberType.Member,
        givenTitle: string | null = null,
        nickname: string = "",
        isSilent: boolean = false,
        joinedAt: Date = new Date(),
        silentUntil: Date | null = null
    ) {
        this.theGuy = member;
        this.type = type;
        this.givenTitle = givenTitle;
        this.nickname = nickname;
        this.isSilent = isSilent;
        this.joinedAt = joinedAt;
        this.silentUntil = silentUntil;
    }
}

/**
 * 聊天响应类
 */
export class ChatResponse {
    public chatId?: string;
    public chatType?: string;
    public displayName?: string;
    public avatarUrl?: string;
    public createdAt: Date = new Date();
    public unreadCount: number = 0;
    public lastActivity: Date = new Date();
    public isBlocked: boolean = false;
    public isPinned: boolean = false;
    public lastMessagePreview?: string;
}