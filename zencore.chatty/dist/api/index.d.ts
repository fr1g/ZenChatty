import { AxiosInstance, AxiosRequestConfig } from 'axios';

declare class ApiClientBase {
    protected client: AxiosInstance;
    protected baseURL: string;
    /**
     * 创建API客户端实例
     * @param baseURL - API基础URL
     * @param timeout - 请求超时时间（毫秒）
     */
    constructor(baseURL?: string, timeout?: number);
    /**
     * 设置认证token
     * @param token - JWT token
     */
    setAuthToken(token: string): void;
    /**
     * 清除认证token
     */
    clearAuthToken(): void;
    /**
     * GET请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    protected get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * POST请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * PUT请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * DELETE请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    protected delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * PATCH请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
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

declare class AuthApiClient extends ApiClientBase {
    /**
     * 用户登录
     * @param request - 登录请求
     * @returns 认证响应
     */
    login(request: LoginRequest): Promise<AuthResponse>;
    /**
     * 用户注册
     * @param request - 注册请求
     * @returns 认证响应
     */
    register(request: RegisterRequest): Promise<AuthResponse>;
    /**
     * 刷新访问令牌
     * @param request - 刷新令牌请求
     * @returns 认证响应
     */
    refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>;
    /**
     * 用户登出
     * @returns 基础响应
     */
    logout(): Promise<BasicResponse>;
    /**
     * 验证令牌
     * @returns 基础响应
     */
    validateToken(): Promise<BasicResponse>;
    /**
     * 请求密码重置
     * @param email - 用户邮箱
     * @returns 基础响应
     */
    requestPasswordReset(email: string): Promise<BasicResponse>;
    /**
     * 重置密码
     * @param token - 重置令牌
     * @param newPassword - 新密码
     * @returns 基础响应
     */
    resetPassword(token: string, newPassword: string): Promise<BasicResponse>;
}

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

declare class UserApiClient extends ApiClientBase {
    /**
     * 获取当前用户信息
     * @returns 用户信息响应
     */
    getCurrentUserInfo(): Promise<UserInfoResponse>;
    /**
     * 获取指定用户信息
     * @param userId - 用户ID
     * @returns 用户信息响应
     */
    getUserInfo(userId: string): Promise<UserInfoResponse>;
    /**
     * 更新用户信息
     * @param userInfo - 用户信息
     * @returns 基础响应
     */
    updateUserInfo(userInfo: Partial<UserInfoResponse>): Promise<BasicResponse>;
    /**
     * 更新用户头像
     * @param avatarFile - 头像文件
     * @returns 基础响应
     */
    updateAvatar(avatarFile: File): Promise<BasicResponse>;
    /**
     * 更新用户背景
     * @param backgroundFile - 背景文件
     * @returns 基础响应
     */
    updateBackground(backgroundFile: File): Promise<BasicResponse>;
    /**
     * 搜索用户
     * @param query - 搜索关键词
     * @returns 用户信息响应列表
     */
    searchUsers(query: string): Promise<UserInfoResponse[]>;
    /**
     * 获取用户隐私设置
     * @returns 隐私设置响应
     */
    getPrivacySettings(): Promise<PrivacySettingsResponse>;
    /**
     * 更新用户隐私设置
     * @param settings - 隐私设置
     * @returns 基础响应
     */
    updatePrivacySettings(settings: Partial<PrivacySettingsResponse>): Promise<BasicResponse>;
    /**
     * 获取用户在线状态
     * @param userId - 用户ID
     * @returns 在线状态
     */
    getUserStatus(userId: string): Promise<{
        status: string;
        lastSeen: Date;
    }>;
    /**
     * 更新用户在线状态
     * @param status - 状态
     * @returns 基础响应
     */
    updateUserStatus(status: string): Promise<BasicResponse>;
}

declare class CreatePrivateChatRequest {
    participantUserId: string;
}
declare class CreateGroupChatRequest {
    groupName: string;
    description: string;
    initialMemberIds: string[];
}

/**
 * 聊天API客户端
 */
declare class ChatApiClient extends ApiClientBase {
    /**
     * 获取用户聊天列表
     * @returns 聊天响应列表
     */
    getChats(): Promise<ChatResponse[]>;
    /**
     * 获取指定聊天详情
     * @param chatId - 聊天ID
     * @returns 聊天响应
     */
    getChat(chatId: string): Promise<ChatResponse>;
    /**
     * 创建私聊
     * @param request - 创建私聊请求
     * @returns 聊天响应
     */
    createPrivateChat(request: CreatePrivateChatRequest): Promise<ChatResponse>;
    /**
     * 创建群聊
     * @param request - 创建群聊请求
     * @returns 聊天响应
     */
    createGroupChat(request: CreateGroupChatRequest): Promise<ChatResponse>;
    /**
     * 删除聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    deleteChat(chatId: string): Promise<BasicResponse>;
    /**
     * 置顶聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    pinChat(chatId: string): Promise<BasicResponse>;
    /**
     * 取消置顶聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    unpinChat(chatId: string): Promise<BasicResponse>;
    /**
     * 屏蔽聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    blockChat(chatId: string): Promise<BasicResponse>;
    /**
     * 取消屏蔽聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    unblockChat(chatId: string): Promise<BasicResponse>;
    /**
     * 标记聊天为已读
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    markAsRead(chatId: string): Promise<BasicResponse>;
    /**
     * 清空聊天记录
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    clearChatHistory(chatId: string): Promise<BasicResponse>;
    /**
     * 获取聊天成员
     * @param chatId - 聊天ID
     * @returns 用户信息列表
     */
    getChatMembers(chatId: string): Promise<any[]>;
    /**
     * 添加聊天成员
     * @param chatId - 聊天ID
     * @param userId - 用户ID
     * @returns 基础响应
     */
    addChatMember(chatId: string, userId: string): Promise<BasicResponse>;
    /**
     * 移除聊天成员
     * @param chatId - 聊天ID
     * @param userId - 用户ID
     * @returns 基础响应
     */
    removeChatMember(chatId: string, userId: string): Promise<BasicResponse>;
}

declare class MessageApiClient extends ApiClientBase {
    /**
     * 获取聊天消息
     * @param chatId - 聊天ID
     * @param page - 页码
     * @param pageSize - 每页大小
     * @returns 消息列表
     */
    getMessages(chatId: string, page?: number, pageSize?: number): Promise<Message[]>;
    /**
     * 发送文本消息
     * @param chatId - 聊天ID
     * @param content - 消息内容
     * @returns 发送消息响应
     */
    sendTextMessage(chatId: string, content: string): Promise<SendMessageResponse>;
    /**
     * 发送图片消息
     * @param chatId - 聊天ID
     * @param imageFile - 图片文件
     * @param caption - 图片描述（可选）
     * @returns 发送消息响应
     */
    sendImageMessage(chatId: string, imageFile: File, caption?: string): Promise<SendMessageResponse>;
    /**
     * 发送文件消息
     * @param chatId - 聊天ID
     * @param file - 文件
     * @returns 发送消息响应
     */
    sendFileMessage(chatId: string, file: File): Promise<SendMessageResponse>;
    /**
     * 删除消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    deleteMessage(chatId: string, messageId: string): Promise<BasicResponse>;
    /**
     * 编辑消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param newContent - 新内容
     * @returns 基础响应
     */
    editMessage(chatId: string, messageId: string, newContent: string): Promise<BasicResponse>;
    /**
     * 撤回消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    recallMessage(chatId: string, messageId: string): Promise<BasicResponse>;
    /**
     * 转发消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param targetChatId - 目标聊天ID
     * @returns 基础响应
     */
    forwardMessage(chatId: string, messageId: string, targetChatId: string): Promise<BasicResponse>;
    /**
     * 标记消息为已读
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    markMessageAsRead(chatId: string, messageId: string): Promise<BasicResponse>;
    /**
     * 搜索消息
     * @param chatId - 聊天ID
     * @param query - 搜索关键词
     * @returns 消息列表
     */
    searchMessages(chatId: string, query: string): Promise<Message[]>;
    /**
     * 获取消息详情
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 消息详情
     */
    getMessage(chatId: string, messageId: string): Promise<Message>;
}

declare class ContactApiClient extends ApiClientBase {
    /**
     * 获取联系人列表
     * @returns 联系人列表
     */
    getContacts(): Promise<Contact[]>;
    /**
     * 添加联系人
     * @param userId - 用户ID
     * @param remark - 备注名（可选）
     * @returns 基础响应
     */
    addContact(userId: string, remark?: string): Promise<BasicResponse>;
    /**
     * 删除联系人
     * @param contactId - 联系人ID
     * @returns 基础响应
     */
    deleteContact(contactId: string): Promise<BasicResponse>;
    /**
     * 更新联系人备注
     * @param contactId - 联系人ID
     * @param remark - 新备注
     * @returns 基础响应
     */
    updateContactRemark(contactId: string, remark: string): Promise<BasicResponse>;
    /**
     * 获取联系人详情
     * @param contactId - 联系人ID
     * @returns 联系人详情
     */
    getContact(contactId: string): Promise<Contact>;
    /**
     * 搜索联系人
     * @param query - 搜索关键词
     * @returns 联系人列表
     */
    searchContacts(query: string): Promise<Contact[]>;
    /**
     * 获取联系人请求列表
     * @returns 联系人请求列表
     */
    getContactRequests(): Promise<any[]>;
    /**
     * 发送联系人请求
     * @param userId - 用户ID
     * @param message - 请求消息（可选）
     * @returns 基础响应
     */
    sendContactRequest(userId: string, message?: string): Promise<BasicResponse>;
    /**
     * 接受联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    acceptContactRequest(requestId: string): Promise<BasicResponse>;
    /**
     * 拒绝联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    rejectContactRequest(requestId: string): Promise<BasicResponse>;
    /**
     * 取消联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    cancelContactRequest(requestId: string): Promise<BasicResponse>;
    /**
     * 获取联系人分组
     * @returns 联系人分组列表
     */
    getContactGroups(): Promise<any[]>;
    /**
     * 创建联系人分组
     * @param name - 分组名称
     * @returns 基础响应
     */
    createContactGroup(name: string): Promise<BasicResponse>;
    /**
     * 删除联系人分组
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    deleteContactGroup(groupId: string): Promise<BasicResponse>;
    /**
     * 移动联系人到分组
     * @param contactId - 联系人ID
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    moveContactToGroup(contactId: string, groupId: string): Promise<BasicResponse>;
}

declare class ZenCoreChattyClient {
    readonly auth: AuthApiClient;
    readonly user: UserApiClient;
    readonly chat: ChatApiClient;
    readonly message: MessageApiClient;
    readonly contact: ContactApiClient;
    constructor(baseURL?: string, port?: number, timeout?: number);
    setAuthToken(token: string): void;
    clearAuthToken(): void;
}

export { ApiClientBase, AuthApiClient, ChatApiClient, ContactApiClient, MessageApiClient, UserApiClient, ZenCoreChattyClient };
