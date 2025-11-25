import axios from 'axios';

class ApiClientBase {
    client;
    baseURL;
    /**
     * 创建API客户端实例
     * @param baseURL - API基础URL
     * @param timeout - 请求超时时间（毫秒）
     */
    constructor(baseURL = 'https://localhost:5637', timeout = 10000) {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // 请求拦截器
        this.client.interceptors.request.use((config) => {
            // 可以在这里添加认证token等
            const token = localStorage?.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // 响应拦截器
        this.client.interceptors.response.use((response) => {
            return response;
        }, (error) => {
            // 可以在这里处理通用错误
            console.error('API请求错误:', error);
            return Promise.reject(error);
        });
    }
    /**
     * 设置认证token
     * @param token - JWT token
     */
    setAuthToken(token) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    /**
     * 清除认证token
     */
    clearAuthToken() {
        delete this.client.defaults.headers.common['Authorization'];
    }
    /**
     * GET请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    /**
     * POST请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    /**
     * PUT请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    /**
     * DELETE请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
    /**
     * PATCH请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }
}

class AuthApiClient extends ApiClientBase {
    /**
     * 用户登录
     * @param request - 登录请求
     * @returns 认证响应
     */
    async login(request) {
        return await this.post('/api/auth/login', request);
    }
    /**
     * 用户注册
     * @param request - 注册请求
     * @returns 认证响应
     */
    async register(request) {
        return await this.post('/api/auth/register', request);
    }
    /**
     * 刷新访问令牌
     * @param request - 刷新令牌请求
     * @returns 认证响应
     */
    async refreshToken(request) {
        return await this.post('/api/auth/refresh', request);
    }
    /**
     * 用户登出
     * @returns 基础响应
     */
    async logout() {
        return await this.post('/api/auth/logout');
    }
    /**
     * 验证令牌
     * @returns 基础响应
     */
    async validateToken() {
        return await this.get('/api/auth/validate');
    }
    /**
     * 请求密码重置
     * @param email - 用户邮箱
     * @returns 基础响应
     */
    async requestPasswordReset(email) {
        return await this.post('/api/auth/forgot-password', { email });
    }
    /**
     * 重置密码
     * @param token - 重置令牌
     * @param newPassword - 新密码
     * @returns 基础响应
     */
    async resetPassword(token, newPassword) {
        return await this.post('/api/auth/reset-password', {
            token,
            newPassword
        });
    }
}

class UserApiClient extends ApiClientBase {
    /**
     * 获取当前用户信息
     * @returns 用户信息响应
     */
    async getCurrentUserInfo() {
        return await this.get('/api/user/me');
    }
    /**
     * 获取指定用户信息
     * @param userId - 用户ID
     * @returns 用户信息响应
     */
    async getUserInfo(userId) {
        return await this.get(`/api/user/${userId}`);
    }
    /**
     * 更新用户信息
     * @param userInfo - 用户信息
     * @returns 基础响应
     */
    async updateUserInfo(userInfo) {
        return await this.put('/api/user/profile', userInfo);
    }
    /**
     * 更新用户头像
     * @param avatarFile - 头像文件
     * @returns 基础响应
     */
    async updateAvatar(avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        return await this.post('/api/user/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * 更新用户背景
     * @param backgroundFile - 背景文件
     * @returns 基础响应
     */
    async updateBackground(backgroundFile) {
        const formData = new FormData();
        formData.append('background', backgroundFile);
        return await this.post('/api/user/background', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * 搜索用户
     * @param query - 搜索关键词
     * @returns 用户信息响应列表
     */
    async searchUsers(query) {
        return await this.get(`/api/user/search?q=${encodeURIComponent(query)}`);
    }
    /**
     * 获取用户隐私设置
     * @returns 隐私设置响应
     */
    async getPrivacySettings() {
        return await this.get('/api/user/privacy');
    }
    /**
     * 更新用户隐私设置
     * @param settings - 隐私设置
     * @returns 基础响应
     */
    async updatePrivacySettings(settings) {
        return await this.put('/api/user/privacy', settings);
    }
    /**
     * 获取用户在线状态
     * @param userId - 用户ID
     * @returns 在线状态
     */
    async getUserStatus(userId) {
        return await this.get(`/api/user/${userId}/status`);
    }
    /**
     * 更新用户在线状态
     * @param status - 状态
     * @returns 基础响应
     */
    async updateUserStatus(status) {
        return await this.put('/api/user/status', { status });
    }
}

/**
 * 聊天API客户端
 */
class ChatApiClient extends ApiClientBase {
    /**
     * 获取用户聊天列表
     * @returns 聊天响应列表
     */
    async getChats() {
        return await this.get('/api/chat');
    }
    /**
     * 获取指定聊天详情
     * @param chatId - 聊天ID
     * @returns 聊天响应
     */
    async getChat(chatId) {
        return await this.get(`/api/chat/${chatId}`);
    }
    /**
     * 创建私聊
     * @param request - 创建私聊请求
     * @returns 聊天响应
     */
    async createPrivateChat(request) {
        return await this.post('/api/chat/private', request);
    }
    /**
     * 创建群聊
     * @param request - 创建群聊请求
     * @returns 聊天响应
     */
    async createGroupChat(request) {
        return await this.post('/api/chat/group', request);
    }
    /**
     * 删除聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async deleteChat(chatId) {
        return await this.delete(`/api/chat/${chatId}`);
    }
    /**
     * 置顶聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async pinChat(chatId) {
        return await this.post(`/api/chat/${chatId}/pin`);
    }
    /**
     * 取消置顶聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async unpinChat(chatId) {
        return await this.delete(`/api/chat/${chatId}/pin`);
    }
    /**
     * 屏蔽聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async blockChat(chatId) {
        return await this.post(`/api/chat/${chatId}/block`);
    }
    /**
     * 取消屏蔽聊天
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async unblockChat(chatId) {
        return await this.delete(`/api/chat/${chatId}/block`);
    }
    /**
     * 标记聊天为已读
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async markAsRead(chatId) {
        return await this.post(`/api/chat/${chatId}/read`);
    }
    /**
     * 清空聊天记录
     * @param chatId - 聊天ID
     * @returns 基础响应
     */
    async clearChatHistory(chatId) {
        return await this.delete(`/api/chat/${chatId}/history`);
    }
    /**
     * 获取聊天成员
     * @param chatId - 聊天ID
     * @returns 用户信息列表
     */
    async getChatMembers(chatId) {
        return await this.get(`/api/chat/${chatId}/members`);
    }
    /**
     * 添加聊天成员
     * @param chatId - 聊天ID
     * @param userId - 用户ID
     * @returns 基础响应
     */
    async addChatMember(chatId, userId) {
        return await this.post(`/api/chat/${chatId}/members`, { userId });
    }
    /**
     * 移除聊天成员
     * @param chatId - 聊天ID
     * @param userId - 用户ID
     * @returns 基础响应
     */
    async removeChatMember(chatId, userId) {
        return await this.delete(`/api/chat/${chatId}/members/${userId}`);
    }
}

class MessageApiClient extends ApiClientBase {
    /**
     * 获取聊天消息
     * @param chatId - 聊天ID
     * @param page - 页码
     * @param pageSize - 每页大小
     * @returns 消息列表
     */
    async getMessages(chatId, page = 1, pageSize = 50) {
        return await this.get(`/api/chat/${chatId}/messages?page=${page}&pageSize=${pageSize}`);
    }
    /**
     * 发送文本消息
     * @param chatId - 聊天ID
     * @param content - 消息内容
     * @returns 发送消息响应
     */
    async sendTextMessage(chatId, content) {
        return await this.post(`/api/chat/${chatId}/messages/text`, { content });
    }
    /**
     * 发送图片消息
     * @param chatId - 聊天ID
     * @param imageFile - 图片文件
     * @param caption - 图片描述（可选）
     * @returns 发送消息响应
     */
    async sendImageMessage(chatId, imageFile, caption) {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (caption) {
            formData.append('caption', caption);
        }
        return await this.post(`/api/chat/${chatId}/messages/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * 发送文件消息
     * @param chatId - 聊天ID
     * @param file - 文件
     * @returns 发送消息响应
     */
    async sendFileMessage(chatId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return await this.post(`/api/chat/${chatId}/messages/file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * 删除消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    async deleteMessage(chatId, messageId) {
        return await this.delete(`/api/chat/${chatId}/messages/${messageId}`);
    }
    /**
     * 编辑消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param newContent - 新内容
     * @returns 基础响应
     */
    async editMessage(chatId, messageId, newContent) {
        return await this.put(`/api/chat/${chatId}/messages/${messageId}`, { content: newContent });
    }
    /**
     * 撤回消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    async recallMessage(chatId, messageId) {
        return await this.post(`/api/chat/${chatId}/messages/${messageId}/recall`);
    }
    /**
     * 转发消息
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @param targetChatId - 目标聊天ID
     * @returns 基础响应
     */
    async forwardMessage(chatId, messageId, targetChatId) {
        return await this.post(`/api/chat/${chatId}/messages/${messageId}/forward`, { targetChatId });
    }
    /**
     * 标记消息为已读
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 基础响应
     */
    async markMessageAsRead(chatId, messageId) {
        return await this.post(`/api/chat/${chatId}/messages/${messageId}/read`);
    }
    /**
     * 搜索消息
     * @param chatId - 聊天ID
     * @param query - 搜索关键词
     * @returns 消息列表
     */
    async searchMessages(chatId, query) {
        return await this.get(`/api/chat/${chatId}/messages/search?q=${encodeURIComponent(query)}`);
    }
    /**
     * 获取消息详情
     * @param chatId - 聊天ID
     * @param messageId - 消息ID
     * @returns 消息详情
     */
    async getMessage(chatId, messageId) {
        return await this.get(`/api/chat/${chatId}/messages/${messageId}`);
    }
}

class ContactApiClient extends ApiClientBase {
    /**
     * 获取联系人列表
     * @returns 联系人列表
     */
    async getContacts() {
        return await this.get('/api/contacts');
    }
    /**
     * 添加联系人
     * @param userId - 用户ID
     * @param remark - 备注名（可选）
     * @returns 基础响应
     */
    async addContact(userId, remark) {
        return await this.post('/api/contacts', { userId, remark });
    }
    /**
     * 删除联系人
     * @param contactId - 联系人ID
     * @returns 基础响应
     */
    async deleteContact(contactId) {
        return await this.delete(`/api/contacts/${contactId}`);
    }
    /**
     * 更新联系人备注
     * @param contactId - 联系人ID
     * @param remark - 新备注
     * @returns 基础响应
     */
    async updateContactRemark(contactId, remark) {
        return await this.put(`/api/contacts/${contactId}/remark`, { remark });
    }
    /**
     * 获取联系人详情
     * @param contactId - 联系人ID
     * @returns 联系人详情
     */
    async getContact(contactId) {
        return await this.get(`/api/contacts/${contactId}`);
    }
    /**
     * 搜索联系人
     * @param query - 搜索关键词
     * @returns 联系人列表
     */
    async searchContacts(query) {
        return await this.get(`/api/contacts/search?q=${encodeURIComponent(query)}`);
    }
    /**
     * 获取联系人请求列表
     * @returns 联系人请求列表
     */
    async getContactRequests() {
        return await this.get('/api/contacts/requests');
    }
    /**
     * 发送联系人请求
     * @param userId - 用户ID
     * @param message - 请求消息（可选）
     * @returns 基础响应
     */
    async sendContactRequest(userId, message) {
        return await this.post('/api/contacts/requests', { userId, message });
    }
    /**
     * 接受联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    async acceptContactRequest(requestId) {
        return await this.post(`/api/contacts/requests/${requestId}/accept`);
    }
    /**
     * 拒绝联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    async rejectContactRequest(requestId) {
        return await this.post(`/api/contacts/requests/${requestId}/reject`);
    }
    /**
     * 取消联系人请求
     * @param requestId - 请求ID
     * @returns 基础响应
     */
    async cancelContactRequest(requestId) {
        return await this.delete(`/api/contacts/requests/${requestId}`);
    }
    /**
     * 获取联系人分组
     * @returns 联系人分组列表
     */
    async getContactGroups() {
        return await this.get('/api/contacts/groups');
    }
    /**
     * 创建联系人分组
     * @param name - 分组名称
     * @returns 基础响应
     */
    async createContactGroup(name) {
        return await this.post('/api/contacts/groups', { name });
    }
    /**
     * 删除联系人分组
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    async deleteContactGroup(groupId) {
        return await this.delete(`/api/contacts/groups/${groupId}`);
    }
    /**
     * 移动联系人到分组
     * @param contactId - 联系人ID
     * @param groupId - 分组ID
     * @returns 基础响应
     */
    async moveContactToGroup(contactId, groupId) {
        return await this.put(`/api/contacts/${contactId}/group`, { groupId });
    }
}

class ZenCoreChattyClient {
    auth;
    user;
    chat;
    message;
    contact;
    constructor(baseURL = 'https://localhost:5637', port = 5637, timeout = 10000) {
        let assembled = baseURL.match(/:[0-9]/g) ? baseURL : baseURL + ":" + port;
        this.auth = new AuthApiClient(assembled, timeout);
        this.user = new UserApiClient(assembled, timeout);
        this.chat = new ChatApiClient(assembled, timeout);
        this.message = new MessageApiClient(assembled, timeout);
        this.contact = new ContactApiClient(assembled, timeout);
    }
    setAuthToken(token) {
        this.auth.setAuthToken(token);
        this.user.setAuthToken(token);
        this.chat.setAuthToken(token);
        this.message.setAuthToken(token);
        this.contact.setAuthToken(token);
    }
    clearAuthToken() {
        this.auth.clearAuthToken();
        this.user.clearAuthToken();
        this.chat.clearAuthToken();
        this.message.clearAuthToken();
        this.contact.clearAuthToken();
    }
}

export { ApiClientBase, AuthApiClient, ChatApiClient, ContactApiClient, MessageApiClient, UserApiClient, ZenCoreChattyClient };
//# sourceMappingURL=index.js.map
