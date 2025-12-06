import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import * as Models from './models/index.js';

// 事件数据接口定义
export interface IncomeMessageData {
    EventType: string;
    ChatUniqueMark: string;
    Timestamp: number;
    Message: Models.Message;
}

export interface PatchMessageData {
    EventType: string;
    ChatUniqueMark: string;
    Timestamp: number;
    UpdatedMessage: Models.Message;
    UpdateType: string;
}

export interface UpdateRecentsData {
    ChatUniqueMark: string;
    Message: Models.Message;
    TotalUnreadCount: number;
    UpdateTime: string;
}

export interface UpdateMessageResponseData {
    Result: string;
    ErrorMessage?: string;
}

export interface ReceiveUpdatedContactAndMessageData {
    Contact: Models.Contact;
    Message: Models.Message;
    TotalUnreadCount: number;
    UpdateTime: string;
}

export default class SignalRClient {
    private connection: HubConnection | null = null;
    private baseUrl: string;
    private accessToken: string | null = null;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * 设置访问令牌用于身份验证
     */
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * 建立SignalR连接
     */
    async connect(): Promise<void> {
        if (this.connection && this.connection.state === 'Connected') {
            return;
        }

        try {
            // 构建完整的SignalR Hub URL，包含端口号
            const hubUrl = `${this.baseUrl}/chatHub`;

            console.log('正在建立SignalR连接:', {
                baseUrl: this.baseUrl,
                hubUrl: hubUrl,
                hasAccessToken: !!this.accessToken,
                accessTokenLength: this.accessToken?.length || 0
            });

            this.connection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => this.accessToken || '',
                    skipNegotiation: false, // 启用协商以支持代理
                    transport: 4 // 使用所有可用传输方式
                })
                .configureLogging(LogLevel.Debug) // 提高日志级别以调试
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
        } catch (error) {
            console.error('SignalR连接失败:', {
                error,
                baseUrl: this.baseUrl,
                hubUrl: `${this.baseUrl}/chatHub`,
                hasAccessToken: !!this.accessToken,
                accessTokenLength: this.accessToken?.length || 0,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * 断开SignalR连接 PASS
     */
    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            console.log('SignalR连接已断开');
        }
    }

    /**
     * 注册服务器端方法调用处理
     */
    private registerServerMethods(): void {
        if (!this.connection) return;

        // 接收新消息事件（对应后端IncomeMessage）
        this.connection.on('IncomeMessage', (data: IncomeMessageData) => {
            console.log('收到新消息事件:', {
                chatId: data.ChatUniqueMark,
                messageId: data.Message.traceId,
                eventType: data.EventType,
                timestamp: data.Timestamp
            });
            this.onIncomeMessage?.(data);
        });

        // 接收消息更新事件（对应后端PatchMessage）
        this.connection.on('PatchMessage', (data: PatchMessageData) => {
            console.log('收到消息更新事件:', {
                chatId: data.ChatUniqueMark,
                messageId: data.UpdatedMessage.traceId,
                eventType: data.EventType,
                updateType: data.UpdateType,
                timestamp: data.Timestamp
            });
            this.onPatchMessage?.(data);
        });

        // 接收最近消息更新事件（对应后端UpdateRecents）
        this.connection.on('UpdateRecents', (data: UpdateRecentsData) => {
            console.log('收到最近消息更新事件:', {
                chatId: data.ChatUniqueMark,
                messageId: data.Message.traceId,
                totalUnreadCount: data.TotalUnreadCount,
                updateTime: data.UpdateTime
            });
            this.onUpdateRecents?.(data);
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
     * 发送消息（对应后端SendMessage方法）PASS
     */
    async sendMessage(request: Models.SendMessageRequest): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            // 设置默认时间戳
            if (!request.SentTimestamp) {
                request.SentTimestamp = Date.now();
            }

            // 后端期望接收完整的SendMessageRequest对象
            await this.connection.invoke('SendMessage', request);
        } catch (error) {
            console.error('发送消息失败:', error);
            throw error;
        }
    }

    /**
     * 更新消息（对应后端UpdateMessage方法）PASS
     */
    async updateMessage(chatUniqueMark: string, newVersion: Models.Message): Promise<UpdateMessageResponseData> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }
        const updateMessageReqData = {
            messageTraceId: newVersion.traceId,
            chatUniqueMark: chatUniqueMark,
            newContent: newVersion.content,
            isCanceled: newVersion.isCanceled,
            isAnnouncement: newVersion.isAnnouncement,
            info: newVersion.info,
            messageType: newVersion.type
        };
        try {
            const response = await this.connection.invoke<UpdateMessageResponseData>('UpdateMessage', updateMessageReqData);
            console.log('消息更新结果:', response);
            return response;
        } catch (error) {
            console.error('更新消息失败:', error);
            throw error;
        }
    }

    /**
     * 加入聊天组（对应后端JoinChat方法）PASS
     */
    async joinChat(chatUniqueMark: string): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('JoinChat', chatUniqueMark);
            console.log('已加入聊天组:', chatUniqueMark);
        } catch (error) {
            console.error('加入聊天组失败:', error);
            throw error;
        }
    }

    /**
     * 离开聊天组（对应后端LeaveChat方法）PASS
     */
    async leaveChat(chatUniqueMark: string): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('LeaveChat', chatUniqueMark);
            console.log('已离开聊天组:', chatUniqueMark);
        } catch (error) {
            console.error('离开聊天组失败:', error);
            throw error;
        }
    }

    /**
     * 标记消息为已读（对应后端MarkMessagesAsRead方法）PASS
     */
    async markMessagesAsRead(chatId: string, messageIds: string[]): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('MarkMessagesAsRead', chatId, messageIds);
        } catch (error) {
            console.error('标记消息已读失败:', error);
            throw error;
        }
    }

    /**
     * 简化的发送消息方法（保持向后兼容）
     */
    async sendSimpleMessage(chatId: string, content: string, messageType: Models.EMessageType = Models.EMessageType.Normal): Promise<void> {
        const request: Models.SendMessageRequest = {
            ChatUniqueMark: chatId,
            Content: content,
            MessageType: messageType,
            SentTimestamp: Date.now()
        };

        return this.sendMessage(request);
    }

    /**
     * 获取连接状态
     */
    getConnectionState(): string {
        return this.connection?.state || 'Disconnected';
    }

    // 事件回调函数

    /**
     * 新消息事件回调
     */
    public onIncomeMessage?: (data: IncomeMessageData) => void;

    /**
     * 消息更新事件回调
     */
    public onPatchMessage?: (data: PatchMessageData) => void;

    /**
     * 最近消息更新事件回调
     */
    public onUpdateRecents?: (data: UpdateRecentsData) => void;

    /**
     * 更新的Contact和Message对象回调（保持向后兼容）
     */
    public onContactAndMessageUpdated?: (contact: Models.Contact, message: Models.Message, totalUnreadCount: number) => void;

    /**
     * 未读计数更新回调
     */
    public onUnreadCountUpdated?: (contactId: string, unreadCount: number) => void;

    /**
     * 联系人更新回调
     */
    public onContactUpdated?: (contact: Models.Contact) => void;

    /**
     * 重新连接中回调
     */
    public onReconnecting?: (error?: Error) => void;

    /**
     * 重新连接成功回调
     */
    public onReconnected?: (connectionId?: string) => void;

    /**
     * 连接关闭回调
     */
    public onConnectionClosed?: (error?: Error) => void;
}