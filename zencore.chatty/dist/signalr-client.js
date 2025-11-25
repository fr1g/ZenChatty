import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

var EUserStatus;
(function (EUserStatus) {
    EUserStatus[EUserStatus["Online"] = 0] = "Online";
    EUserStatus[EUserStatus["Offline"] = 1] = "Offline";
    EUserStatus[EUserStatus["Quit"] = 2] = "Quit";
    EUserStatus[EUserStatus["Disabled"] = 3] = "Disabled";
    EUserStatus[EUserStatus["New"] = 4] = "New";
    EUserStatus[EUserStatus["Unknown"] = 5] = "Unknown";
})(EUserStatus || (EUserStatus = {}));
var EGender;
(function (EGender) {
    EGender[EGender["Male"] = 0] = "Male";
    EGender[EGender["Female"] = 1] = "Female";
    EGender[EGender["Unset"] = 2] = "Unset";
})(EGender || (EGender = {}));
var EChatStatus;
(function (EChatStatus) {
    EChatStatus[EChatStatus["Normal"] = 0] = "Normal";
    EChatStatus[EChatStatus["GroupDisabled"] = 1] = "GroupDisabled";
    EChatStatus[EChatStatus["Unreachable"] = 2] = "Unreachable";
})(EChatStatus || (EChatStatus = {}));
var EMessageType;
(function (EMessageType) {
    EMessageType[EMessageType["Normal"] = 0] = "Normal";
    EMessageType[EMessageType["Requesting"] = 1] = "Requesting";
    EMessageType[EMessageType["Quote"] = 2] = "Quote";
    EMessageType[EMessageType["Forward"] = 3] = "Forward";
    EMessageType[EMessageType["Event"] = 4] = "Event";
    EMessageType[EMessageType["Announcement"] = 5] = "Announcement";
    EMessageType[EMessageType["Canceled"] = 6] = "Canceled";
})(EMessageType || (EMessageType = {}));
var EFileType;
(function (EFileType) {
    EFileType[EFileType["Image"] = 0] = "Image";
    EFileType[EFileType["Video"] = 1] = "Video";
    EFileType[EFileType["Audio"] = 2] = "Audio";
    EFileType[EFileType["Document"] = 3] = "Document";
    EFileType[EFileType["Other"] = 4] = "Other";
})(EFileType || (EFileType = {}));
var EGroupMemberType;
(function (EGroupMemberType) {
    EGroupMemberType[EGroupMemberType["Owner"] = 0] = "Owner";
    EGroupMemberType[EGroupMemberType["Admin"] = 1] = "Admin";
    EGroupMemberType[EGroupMemberType["Member"] = 2] = "Member";
})(EGroupMemberType || (EGroupMemberType = {}));
var EMessageSendResult;
(function (EMessageSendResult) {
    EMessageSendResult[EMessageSendResult["Success"] = 200] = "Success";
    EMessageSendResult[EMessageSendResult["Unauthorized"] = 401] = "Unauthorized";
    EMessageSendResult[EMessageSendResult["Forbidden"] = 403] = "Forbidden";
    EMessageSendResult[EMessageSendResult["ChatNotFound"] = 404] = "ChatNotFound";
    EMessageSendResult[EMessageSendResult["SenderNotFound"] = 405] = "SenderNotFound";
    EMessageSendResult[EMessageSendResult["ContentEmpty"] = 406] = "ContentEmpty";
    EMessageSendResult[EMessageSendResult["PrivateChatBlocked"] = 407] = "PrivateChatBlocked";
    EMessageSendResult[EMessageSendResult["GroupChatDisabled"] = 408] = "GroupChatDisabled";
    EMessageSendResult[EMessageSendResult["PrivateChatNotAllowed"] = 409] = "PrivateChatNotAllowed";
    EMessageSendResult[EMessageSendResult["NotInGroup"] = 410] = "NotInGroup";
    EMessageSendResult[EMessageSendResult["UserMuted"] = 411] = "UserMuted";
    EMessageSendResult[EMessageSendResult["ViaGroupChatValidationFailed"] = 412] = "ViaGroupChatValidationFailed";
    EMessageSendResult[EMessageSendResult["InternalError"] = 500] = "InternalError";
})(EMessageSendResult || (EMessageSendResult = {}));
var EPrivacyVisibilityRange;
(function (EPrivacyVisibilityRange) {
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["None"] = 0] = "None";
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["Friends"] = 1] = "Friends";
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["FriendsAndGroups"] = 2] = "FriendsAndGroups";
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["Everyone"] = 3] = "Everyone";
})(EPrivacyVisibilityRange || (EPrivacyVisibilityRange = {}));

class SignalRClient {
    connection = null;
    baseUrl;
    accessToken = null;
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }
    /**
     * 设置访问令牌用于身份验证
     */
    setAccessToken(token) {
        this.accessToken = token;
    }
    /**
     * 建立SignalR连接
     */
    async connect() {
        if (this.connection && this.connection.state === 'Connected') {
            return;
        }
        try {
            this.connection = new HubConnectionBuilder()
                .withUrl(`${this.baseUrl}/chatHub`, {
                accessTokenFactory: () => this.accessToken || ''
            })
                .configureLogging(LogLevel.Information)
                .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                }
            })
                .build();
            // 注册服务器端方法调用处理
            this.registerServerMethods();
            await this.connection.start();
            console.log('SignalR连接已建立');
        }
        catch (error) {
            console.error('SignalR连接失败:', error);
            throw error;
        }
    }
    /**
     * 断开SignalR连接
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            console.log('SignalR连接已断开');
        }
    }
    /**
     * 注册服务器端方法调用处理
     */
    registerServerMethods() {
        if (!this.connection)
            return;
        // 接收新消息
        this.connection.on('ReceiveMessage', (message) => {
            this.onMessageReceived?.(message);
        });
        // 接收未读计数更新
        this.connection.on('UpdateUnreadCount', (contactId, unreadCount) => {
            this.onUnreadCountUpdated?.(contactId, unreadCount);
        });
        // 接收联系人更新
        this.connection.on('UpdateContact', (contact) => {
            this.onContactUpdated?.(contact);
        });
        // 连接状态变化
        this.connection.onreconnecting((error) => {
            console.log('SignalR重新连接中...', error);
            this.onReconnecting?.(error);
        });
        this.connection.onreconnected((connectionId) => {
            console.log('SignalR重新连接成功:', connectionId);
            this.onReconnected?.(connectionId);
        });
        this.connection.onclose((error) => {
            console.log('SignalR连接关闭:', error);
            this.onConnectionClosed?.(error);
        });
    }
    /**
     * 发送消息
     */
    async sendMessage(chatId, content, messageType = EMessageType.Normal) {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }
        try {
            await this.connection.invoke('SendMessage', chatId, content, messageType);
        }
        catch (error) {
            console.error('发送消息失败:', error);
            throw error;
        }
    }
    /**
     * 加入聊天组
     */
    async joinChat(chatId) {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }
        try {
            await this.connection.invoke('JoinChat', chatId);
        }
        catch (error) {
            console.error('加入聊天组失败:', error);
            throw error;
        }
    }
    /**
     * 离开聊天组
     */
    async leaveChat(chatId) {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }
        try {
            await this.connection.invoke('LeaveChat', chatId);
        }
        catch (error) {
            console.error('离开聊天组失败:', error);
            throw error;
        }
    }
    /**
     * 标记消息为已读
     */
    async markMessagesAsRead(chatId, messageIds) {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }
        try {
            await this.connection.invoke('MarkMessagesAsRead', chatId, messageIds);
        }
        catch (error) {
            console.error('标记消息已读失败:', error);
            throw error;
        }
    }
    /**
     * 获取连接状态
     */
    getConnectionState() {
        return this.connection?.state || 'Disconnected';
    }
    // 事件回调函数
    onMessageReceived;
    onUnreadCountUpdated;
    onContactUpdated;
    onReconnecting;
    onReconnected;
    onConnectionClosed;
}

export { SignalRClient as default };
//# sourceMappingURL=signalr-client.js.map
