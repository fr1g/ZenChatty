export const MessageActs = {
    // 消息相关操作
    sendMessage: (chatId: string, content: string) => {
        // 发送消息
    },
    
    getMessageList: (chatId: string, page?: number) => {
        // 获取消息列表
    },
    
    getMessageDetails: (messageId: string) => {
        // 获取消息详情
    },
    
    updateMessage: (messageId: string, content: string) => {
        // 更新消息
    },
    
    deleteMessage: (messageId: string) => {
        // 删除消息
    },
    
    markAsRead: (messageId: string) => {
        // 标记为已读
    },
    
    forwardMessage: (messageId: string, targetChatId: string) => {
        // 转发消息
    }
};