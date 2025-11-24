import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import * as Models from './models/index.js';

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
        } catch (error) {
            console.error('SignalR连接失败:', error);
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

        // 接收新消息
        this.connection.on('ReceiveMessage', (message: Models.Message) => {
            this.onMessageReceived?.(message);
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
     * 发送消息
     */
    async sendMessage(chatId: string, content: string, messageType: Models.EMessageType = Models.EMessageType.Normal): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('SendMessage', chatId, content, messageType);
        } catch (error) {
            console.error('发送消息失败:', error);
            throw error;
        }
    }

    /**
     * 加入聊天组
     */
    async joinChat(chatId: string): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('JoinChat', chatId);
        } catch (error) {
            console.error('加入聊天组失败:', error);
            throw error;
        }
    }

    /**
     * 离开聊天组
     */
    async leaveChat(chatId: string): Promise<void> {
        if (!this.connection || this.connection.state !== 'Connected') {
            throw new Error('SignalR连接未建立');
        }

        try {
            await this.connection.invoke('LeaveChat', chatId);
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
    public onMessageReceived?: (message: Models.Message) => void;
    public onUnreadCountUpdated?: (contactId: string, unreadCount: number) => void;
    public onContactUpdated?: (contact: Models.Contact) => void;
    public onReconnecting?: (error?: Error) => void;
    public onReconnected?: (connectionId?: string) => void;
    public onConnectionClosed?: (error?: Error) => void;
}