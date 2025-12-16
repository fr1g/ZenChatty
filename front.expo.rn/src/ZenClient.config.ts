export const DefaultConfig = {
    baseURL: 'http://10.0.2.2',  // 安卓模拟器访问本地后端使用 10.0.2.2，真机请使用电脑的局域网IP
    port: 5637,
    userToken: null, // need to be set dynamically. If using atomic client, set it from redux-stored.
    userAgent: 'ZenChatty/reactnative/official',
    timeout: 1000000,
}