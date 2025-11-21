// SignalR客户端未读消息计数实现示例
class UnreadCountManager {
    constructor(connection) {
        this.connection = connection;
        this.unreadCounts = new Map(); // chatUniqueMark -> count
        this.totalUnreadCount = 0;
        
        this.setupEventHandlers();
    }

    // 设置事件处理器
    setupEventHandlers() {
        // 监听未读计数更新
        this.connection.on('UpdateUnreadCount', (data) => {
            this.handleUnreadCountUpdate(data);
        });

        // 监听未读计数列表
        this.connection.on('ReceiveUnreadCounts', (data) => {
            this.handleReceiveUnreadCounts(data);
        });

        // 监听连接状态变化
        this.connection.onreconnecting(() => {
            console.log('连接重连中...');
        });

        this.connection.onreconnected(() => {
            console.log('连接已恢复，重新获取未读计数');
            this.getUnreadCounts();
        });
    }

    // 处理单个聊天的未读计数更新
    handleUnreadCountUpdate(data) {
        const { ChatUniqueMark, UnreadCount, TotalUnreadCount } = data;
        
        // 更新单个聊天的未读计数
        this.unreadCounts.set(ChatUniqueMark, UnreadCount);
        this.totalUnreadCount = TotalUnreadCount;
        
        // 更新UI
        this.updateUI(ChatUniqueMark, UnreadCount, TotalUnreadCount);
        
        console.log(`未读计数更新: 聊天 ${ChatUniqueMark} -> ${UnreadCount}, 总计: ${TotalUnreadCount}`);
    }

    // 处理未读计数列表
    handleReceiveUnreadCounts(data) {
        const { UnreadCounts, TotalUnreadCount } = data;
        
        // 清空现有数据
        this.unreadCounts.clear();
        
        // 更新所有聊天的未读计数
        Object.entries(UnreadCounts).forEach(([chatId, count]) => {
            this.unreadCounts.set(chatId, count);
        });
        
        this.totalUnreadCount = TotalUnreadCount;
        
        // 更新UI
        this.updateAllUI();
        
        console.log('收到未读计数列表，总计:', TotalUnreadCount);
    }

    // 获取指定聊天的未读计数
    getUnreadCount(chatUniqueMark) {
        return this.unreadCounts.get(chatUniqueMark) || 0;
    }

    // 获取总未读计数
    getTotalUnreadCount() {
        return this.totalUnreadCount;
    }

    // 标记消息已读
    async markAsRead(chatUniqueMark) {
        try {
            await this.connection.invoke('MarkMessagesAsRead', chatUniqueMark);
            console.log(`标记聊天 ${chatUniqueMark} 消息已读`);
        } catch (error) {
            console.error('标记消息已读失败:', error);
        }
    }

    // 获取所有未读计数
    async getUnreadCounts() {
        try {
            await this.connection.invoke('GetUnreadCounts');
        } catch (error) {
            console.error('获取未读计数失败:', error);
        }
    }

    // 更新UI - 单个聊天
    updateUI(chatUniqueMark, unreadCount, totalUnreadCount) {
        // 更新聊天列表中的未读计数
        const chatElement = document.querySelector(`[data-chat-id="${chatUniqueMark}"]`);
        if (chatElement) {
            const badge = chatElement.querySelector('.unread-badge');
            if (badge) {
                badge.textContent = unreadCount > 0 ? unreadCount : '';
                badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
        }

        // 更新总未读计数
        const totalBadge = document.getElementById('total-unread-badge');
        if (totalBadge) {
            totalBadge.textContent = totalUnreadCount > 0 ? totalUnreadCount : '';
            totalBadge.style.display = totalUnreadCount > 0 ? 'inline-block' : 'none';
        }

        // 更新页面标题（如果有未读消息）
        if (totalUnreadCount > 0) {
            document.title = `(${totalUnreadCount}) ZenChatty`;
        } else {
            document.title = 'ZenChatty';
        }
    }

    // 更新所有UI
    updateAllUI() {
        // 更新所有聊天的未读计数
        this.unreadCounts.forEach((count, chatId) => {
            this.updateUI(chatId, count, this.totalUnreadCount);
        });

        // 更新总未读计数
        this.updateUI(null, 0, this.totalUnreadCount);
    }
}

// 使用示例
async function initializeUnreadCountManager() {
    // 创建SignalR连接
    const connection = new signalR.HubConnectionBuilder()
        .withUrl('/chatHub')
        .withAutomaticReconnect()
        .build();

    // 创建未读计数管理器
    const unreadCountManager = new UnreadCountManager(connection);

    try {
        // 启动连接
        await connection.start();
        console.log('SignalR连接已建立');

        // 连接成功后获取初始未读计数
        await unreadCountManager.getUnreadCounts();

        return unreadCountManager;
    } catch (error) {
        console.error('SignalR连接失败:', error);
        return null;
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
    const unreadCountManager = await initializeUnreadCountManager();
    
    if (unreadCountManager) {
        // 将管理器暴露给全局，方便其他组件使用
        window.unreadCountManager = unreadCountManager;
        
        // 示例：点击聊天项时标记已读
        document.addEventListener('click', (event) => {
            const chatItem = event.target.closest('[data-chat-id]');
            if (chatItem) {
                const chatId = chatItem.dataset.chatId;
                unreadCountManager.markAsRead(chatId);
            }
        });
    }
});

// React组件示例（如果使用React）
/*
import React, { useEffect, useState } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

const UnreadCountComponent = () => {
    const [unreadCounts, setUnreadCounts] = useState({});
    const [totalUnread, setTotalUnread] = useState(0);

    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl('/chatHub')
            .withAutomaticReconnect()
            .build();

        connection.on('UpdateUnreadCount', (data) => {
            setUnreadCounts(prev => ({
                ...prev,
                [data.ChatUniqueMark]: data.UnreadCount
            }));
            setTotalUnread(data.TotalUnreadCount);
        });

        connection.start().then(() => {
            connection.invoke('GetUnreadCounts');
        });

        return () => {
            connection.stop();
        };
    }, []);

    const markAsRead = (chatId) => {
        // 调用标记已读方法
    };

    return (
        <div>
            <div>总未读: {totalUnread}</div>
            {/* 渲染聊天列表 */}
        </div>
    );
};
*/