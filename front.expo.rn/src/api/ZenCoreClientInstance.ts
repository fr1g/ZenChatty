import { CreateZenCoreClient, ZenCoreClient } from 'zen-core-chatty-ts';

// 创建全局的ZenCoreClient实例
const zenCoreClient: ZenCoreClient = CreateZenCoreClient({
  baseURL: 'http://localhost:5637', // 后端服务器地址
  port: 5637,
  userToken: undefined, // 登录后设置
  timeout: 10000
});

export default zenCoreClient;