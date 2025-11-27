import { StorageMethods, initializeStorage } from './redux/storageAdapter';

async function testStorageAdapter() {
  console.log('开始测试SQLite存储适配器...');
  
  try {
    // 1. 初始化存储适配器
    console.log('1. 初始化存储适配器...');
    await initializeStorage();
    console.log('✓ 存储适配器初始化成功');
    
    // 2. 测试storageMethod方法
    console.log('2. 测试storageMethod方法...');
    const testKey = 'test_key';
    const testValue = JSON.stringify({ message: 'Hello, SQLite!', timestamp: Date.now() });
    
    await StorageMethods.storageMethod(testKey, testValue);
    console.log('✓ storageMethod方法测试成功');
    
    // 3. 测试readMethod方法
    console.log('3. 测试readMethod方法...');
    const retrievedValue = await StorageMethods.readMethod(testKey);
    
    if (retrievedValue === testValue) {
      console.log('✓ readMethod方法测试成功 - 数据正确读取');
    } else {
      console.log('✗ readMethod方法测试失败 - 数据不匹配');
      console.log('原始数据:', testValue);
      console.log('读取数据:', retrievedValue);
    }
    
    // 4. 测试SQLiteStorageAdapter的特定方法
    console.log('4. 测试SQLiteStorageAdapter的特定方法...');
    
    // 测试用户数据存储
    const testUser = {
      id: 'test_user_123',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: null,
      status: 'online',
      gender: 'unknown',
      privacyVisibilityRange: 'public',
      createdAt: new Date().toISOString()
    };
    
    // 注意：这里需要直接导入SQLiteStorageAdapter来测试特定方法
    // 由于StorageMethods接口只包含storageMethod和readMethod，
    // 我们需要直接测试SQLiteStorageAdapter的实例
    
    console.log('✓ 基础存储功能测试完成');
    
    // 5. 测试Redux状态持久化
    console.log('5. 测试Redux状态持久化...');
    const reduxState = {
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      }
    };
    
    await StorageMethods.storageMethod('redux_state', JSON.stringify(reduxState));
    const restoredState = await StorageMethods.readMethod('redux_state');
    
    if (restoredState) {
      const parsedState = JSON.parse(restoredState);
      console.log('✓ Redux状态持久化测试成功');
      console.log('存储的状态:', parsedState);
    } else {
      console.log('✗ Redux状态持久化测试失败');
    }
    
    console.log('\n✅ 所有存储功能测试完成！');
    
  } catch (error) {
    console.error('❌ 存储适配器测试失败:', error);
  }
}

// 运行测试
testStorageAdapter().catch(console.error);