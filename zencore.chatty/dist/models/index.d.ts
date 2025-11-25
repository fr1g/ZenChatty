declare enum EUserStatus {
    Online = 0,
    Offline = 1,
    Quit = 2,
    Disabled = 3,
    New = 4,
    Unknown = 5
}
declare enum EGender {
    Male = 0,
    Female = 1,
    Unset = 2
}
declare enum EChatStatus {
    Normal = 0,
    GroupDisabled = 1,
    Unreachable = 2
}
declare enum EMessageType {
    Normal = 0,
    Requesting = 1,
    Quote = 2,
    Forward = 3,
    Event = 4,// Send to receiver, as a system message (left from chat, kicked from chat, blocked message)
    Announcement = 5,
    Canceled = 6
}
declare enum EFileType {
    Image = 0,
    Video = 1,
    Audio = 2,
    Document = 3,
    Other = 4
}
declare enum EGroupMemberType {
    Owner = 0,
    Admin = 1,
    Member = 2
}
declare enum EMessageSendResult {
    Success = 200,
    Unauthorized = 401,
    Forbidden = 403,
    ChatNotFound = 404,
    SenderNotFound = 405,
    ContentEmpty = 406,
    PrivateChatBlocked = 407,
    GroupChatDisabled = 408,
    PrivateChatNotAllowed = 409,
    NotInGroup = 410,
    UserMuted = 411,
    ViaGroupChatValidationFailed = 412,
    InternalError = 500
}
declare enum EPrivacyVisibilityRange {
    None = 0,
    Friends = 1,
    FriendsAndGroups = 2,
    Everyone = 3
}

declare class Message {
    traceId: string;
    private _content;
    info: string;
    senderId: string;
    sender: User;
    viaGroupChatId?: string;
    ofChatId: string;
    isMentioningAll: boolean;
    isCanceled: boolean;
    isAnnouncement: boolean;
    mentionedUserGuids?: string[];
    type: EMessageType;
    sentTimestamp: number;
    serverCaughtTimestamp: number;
    ofChat: Chat;
    constructor(sender: User, ofChat: Chat, content: string);
    get content(): string;
    set content(value: string);
}
declare class SendMessageResponse {
    messageId: string;
    sentTimestamp: number;
    result: string;
    errorMessage?: string;
}

/**
 * 聊天基础类
 */
declare class Chat {
    [x: string]: any;
    uniqueMark: string | undefined;
    initBy: User;
    history: any[];
    status: EChatStatus;
    constructor(initBy: User, history?: any[], uniqueMark?: string | undefined, status?: EChatStatus);
}
declare class PrivateChat extends Chat {
    isInformal: boolean;
    receiver: User;
    constructor(initBy: User, receiver: User, isInformal?: boolean);
}
declare class GroupChat extends Chat {
    members: GroupChatMember[];
    settings: GroupSettings;
    groupAnnounce: Message[];
    constructor(initBy: User, members: GroupChatMember[], settings?: GroupSettings, groupAnnounce?: Message[]);
}
declare class GroupSettings {
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
declare class GroupChatMember {
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
declare class ChatResponse {
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

declare class Contact {
    contactId: string;
    host: User;
    object: Chat;
    lastUnreadCount: number;
    lastUsed: Date;
    addTime: Date;
    isPinned: boolean;
    isBlocked: boolean;
    displayName: string | null;
    avatarFileLocator: string | null;
    constructor(id: string, host: User, object: Chat, lastUnreadCount?: number, lastUsed?: Date, addTime?: Date, isPinned?: boolean, isBlocked?: boolean, displayName?: string | null, avatarFileLocator?: string | null);
}
declare class PrivacySettings {
    isDiscoverableViaSearch: boolean;
    isInvitableToGroup: boolean;
    isAddableFromGroup: boolean;
    isNewChatKeepSilent: boolean;
    contactVisibility: EPrivacyVisibilityRange;
    bioVisibility: EPrivacyVisibilityRange;
    genderVisibility: EPrivacyVisibilityRange;
    constructor(isDiscoverableViaSearch?: boolean, isInvitableToGroup?: boolean, isAddableFromGroup?: boolean, isNewChatKeepSilent?: boolean, contactVisibility?: EPrivacyVisibilityRange, bioVisibility?: EPrivacyVisibilityRange, genderVisibility?: EPrivacyVisibilityRange);
}
declare class PrivacySettingsResponse {
    privacySettings: PrivacySettings;
    success: boolean;
    message: string;
}
declare class DeviceSession {
    deviceId: string;
    userId: string;
    deviceName: string;
    deviceType: string;
    lastActiveAt: Date;
    createdAt: Date;
}
declare class UserFile {
    fileId: string;
    userId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    uploadedAt: Date;
}
declare class GroupInviteLink {
    inviteLinkId: string;
    groupChatId: string;
    inviteCode: string;
    createdById: string;
    maxUses: number;
    usedCount: number;
    expiresAt?: Date;
    createdAt: Date;
}

declare class User {
    localId: string;
    email: string;
    displayName: string;
    avatarFileLocator: string;
    backgroundFileLocator: string;
    bio: string;
    customId: string | undefined;
    phoneNumber: string | undefined;
    status: EUserStatus;
    gender: EGender;
    birth: Date | undefined;
    registeredAt: Date;
    privacies: PrivacySettings;
    constructor(email: string, displayName: string, customId: string | undefined, localId?: string, registeredAt?: Date, avatarFileLocator?: string, backgroundFileLocator?: string, bio?: string, phoneNumber?: string | undefined, status?: EUserStatus, gender?: EGender, birth?: Date | undefined, privacies?: PrivacySettings);
}
declare class UserInfoResponse {
    localId: string;
    message: string;
    email?: string;
    displayName?: string;
    avatarFileLocator?: string;
    backgroundFileLocator?: string;
    bio?: string;
    customId?: string;
    phoneNumber?: string;
    status: EUserStatus;
    gender: EGender;
    birth?: Date;
    registeredAt: Date;
    success: boolean;
}
declare class UserAuthObject {
    userId: string;
    passwordHash: string;
    passwordSalt: string;
}

declare class AuthResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    deviceId: string;
    userInfo: UserInfo;
}
declare class UserInfo {
    userId: string;
    username: string;
    displayName: string;
    email: string;
    status: string;
}
declare class LoginRequest {
    username: string;
    password: string;
    deviceId: string;
}
declare class RegisterRequest {
    email: string;
    username: string;
    password: string;
    displayName: string;
    deviceId: string;
}
declare class RefreshTokenRequest {
    refreshToken: string;
    deviceId: string;
}
declare class BasicResponse {
    success: boolean;
    message: string;
}

declare class CreatePrivateChatRequest {
    participantUserId: string;
}
declare class CreateGroupChatRequest {
    groupName: string;
    description: string;
    initialMemberIds: string[];
}
declare class SendMessageRequest {
    chatId: string;
    content: string;
    messageType: EMessageType;
    mentionedUserIds?: string[];
    isMentioningAll: boolean;
    isAnnouncement: boolean;
}
declare class RecallMessageRequest {
    messageId: string;
    chatId: string;
}
declare class GroupManagementRequest {
    groupId: string;
    targetUserId: string;
    action: string;
}
declare class UpdateGroupSettingsRequest {
    groupId: string;
    groupName?: string;
    description?: string;
    allowAnyoneInvite?: boolean;
    requireApprovalToJoin?: boolean;
    allowSendMessages?: boolean;
    allowSendMedia?: boolean;
    allowSendFiles?: boolean;
}
declare class GroupInviteLinkRequest {
    groupId: string;
    maxUses: number;
    expiresAt?: Date;
}
declare class PrivacyCheckRequest {
    targetUserId: string;
    checkType: string;
}

export { AuthResponse, BasicResponse, Chat, ChatResponse, Contact, CreateGroupChatRequest, CreatePrivateChatRequest, DeviceSession, EChatStatus, EFileType, EGender, EGroupMemberType, EMessageSendResult, EMessageType, EPrivacyVisibilityRange, EUserStatus, GroupChat, GroupChatMember, GroupInviteLink, GroupInviteLinkRequest, GroupManagementRequest, GroupSettings, LoginRequest, Message, PrivacyCheckRequest, PrivacySettings, PrivacySettingsResponse, PrivateChat, RecallMessageRequest, RefreshTokenRequest, RegisterRequest, SendMessageRequest, SendMessageResponse, UpdateGroupSettingsRequest, User, UserAuthObject, UserFile, UserInfo, UserInfoResponse };
