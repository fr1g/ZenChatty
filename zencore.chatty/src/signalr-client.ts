import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import * as Models from './models/index.js';

interface SendMessageRequest {
    ChatUniqueMark: string;
    Content: string;
    SentTimestamp?: number;
    MessageType?: Models.EMessageType;
    ViaGroupChatId?: string;
    IsMentioningAll?: boolean;
    MentionedUserIds?: string[];
    Info?: string;
}

interface ReceiveUpdatedContactAndMessageData {
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
     * 断开SignalR连接
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

        // 接收更新的Contact和Message对象（后端实际推送的数据格式）
        this.connection.on('ReceiveUpdatedContactAndMessage', (data: ReceiveUpdatedContactAndMessageData) => {
            console.log('收到更新的Contact和Message:', data);
            this.onContactAndMessageUpdated?.(data.Contact, data.Message, data.TotalUnreadCount);
        });

        // 接收未读计数更新
        this.connection.on('UpdateUnreadCount', (contactId: string, unreadCount: number) => {
            this.onUnreadCountUpdated?.(contactId, unreadCount);
        });

        // 接收联系人更新
        this.connection.on('UpdateContact', (contact: Models.Contact) => {
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
     * 发送消息（修复参数匹配问题）
     */
    async sendMessage(request: SendMessageRequest): Promise<void> {
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
     * 简化的发送消息方法（保持向后兼容）
     */
    async sendSimpleMessage(chatId: string, content: string, messageType: Models.EMessageType = Models.EMessageType.Normal): Promise<void> {
        const request: SendMessageRequest = {
            ChatUniqueMark: chatId,
            Content: content,
            MessageType: messageType,
            SentTimestamp: Date.now()
        };

        return this.sendMessage(request);
    }

    /**
     * 加入聊天组
     */
    async joinChat(chatUniqueMark: string): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('JoinChat', chatUniqueMark);
        } catch (error) {
            console.error('加入聊天组失败:', error);
            throw error;
        }
    }

    /**
     * 离开聊天组
     */
    async leaveChat(chatUniqueMark: string): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('LeaveChat', chatUniqueMark);
        } catch (error) {
            console.error('离开聊天组失败:', error);
            throw error;
        }
    }

    /**
     * 标记消息为已读
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
     * 获取连接状态
     */
    getConnectionState(): string {
        return this.connection?.state || 'Disconnected';
    }

    // 事件回调函数
    public onContactAndMessageUpdated?: (contact: Models.Contact, message: Models.Message, totalUnreadCount: number) => void;
    public onUnreadCountUpdated?: (contactId: string, unreadCount: number) => void;
    public onContactUpdated?: (contact: Models.Contact) => void;
    public onReconnecting?: (error?: Error) => void;
    public onReconnected?: (connectionId?: string) => void;
    public onConnectionClosed?: (error?: Error) => void;
}