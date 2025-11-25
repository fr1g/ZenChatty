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

declare class SignalRClient {
    private connection;
    private baseUrl;
    private accessToken;
    constructor(baseUrl?: string);
    /**
     * 设置访问令牌用于身份验证
     */
    setAccessToken(token: string): void;
    /**
     * 建立SignalR连接
     */
    connect(): Promise<void>;
    /**
     * 断开SignalR连接
     */
    disconnect(): Promise<void>;
    /**
     * 注册服务器端方法调用处理
     */
    private registerServerMethods;
    /**
     * 发送消息
     */
    sendMessage(chatId: string, content: string, messageType?: EMessageType): Promise<void>;
    /**
     * 加入聊天组
     */
    joinChat(chatId: string): Promise<void>;
    /**
     * 离开聊天组
     */
    leaveChat(chatId: string): Promise<void>;
    /**
     * 标记消息为已读
     */
    markMessagesAsRead(chatId: string, messageIds: string[]): Promise<void>;
    /**
     * 获取连接状态
     */
    getConnectionState(): string;
    onMessageReceived?: (message: Message) => void;
    onUnreadCountUpdated?: (contactId: string, unreadCount: number) => void;
    onContactUpdated?: (contact: Contact) => void;
    onReconnecting?: (error?: Error) => void;
    onReconnected?: (connectionId?: string) => void;
    onConnectionClosed?: (error?: Error) => void;
}

export { SignalRClient as default };
