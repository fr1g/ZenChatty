import { SQLiteStorageAdapter } from './database/SQLiteStorageAdapter';
import zenCoreClient from './api/ZenCoreClientInstance';

/**
 * 测试用户信息缓存功能
 */
async function testUserInfoCache() {
  console.log('=== 开始测试用户信息缓存功能 ===');
  
  try {
    // 1. 初始化存储适配器
    const storageAdapter = new SQLiteStorageAdapter();
    console.log('✅ 存储适配器初始化成功');
    
    // 2. 检查是否已缓存用户信息
    const cachedUserInfo = await storageAdapter.getCachedCurrentUserInfo();
    if (cachedUserInfo) {
      console.log('📋 已缓存的用户信息:', cachedUserInfo);
    } else {
      console.log('ℹ️ 未找到缓存的用户信息');
    }
    
    // 3. 模拟用户信息（用于测试缓存功能）
    const mockUserInfo = {
      userId: 'test-user-123',
      username: 'testuser',
      displayName: '测试用户',
      email: 'test@example.com',
      status: 'online'
    };
    
    // 4. 测试缓存用户信息
    console.log('🔄 测试缓存用户信息...');
    await storageAdapter.cacheCurrentUserInfo(mockUserInfo);
    console.log('✅ 用户信息缓存成功');
    
    // 5. 验证缓存是否成功
    const retrievedUserInfo = await storageAdapter.getCachedCurrentUserInfo();
    if (retrievedUserInfo) {
      console.log('✅ 成功获取缓存的用户信息:', retrievedUserInfo);
      
      // 验证字段匹配
      if (retrievedUserInfo.userId === mockUserInfo.userId &&
          retrievedUserInfo.username === mockUserInfo.username &&
          retrievedUserInfo.displayName === mockUserInfo.displayName &&
          retrievedUserInfo.email === mockUserInfo.email) {
        console.log('✅ 用户信息字段验证通过');
      } else {
        console.log('❌ 用户信息字段验证失败');
      }
    } else {
      console.log('❌ 获取缓存用户信息失败');
    }
    
    // 6. 测试ZenCoreClient实例
    console.log('🔄 测试ZenCoreClient实例...');
    console.log('ZenCoreClient实例:', zenCoreClient);
    console.log('✅ ZenCoreClient实例创建成功');
    
    // 7. 测试设置认证令牌
    const testToken = 'test-token-123';
    zenCoreClient.setAuthToken(testToken);
    console.log('✅ 认证令牌设置成功');
    
    console.log('=== 用户信息缓存功能测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 执行测试
testUserInfoCache().catch(console.error);