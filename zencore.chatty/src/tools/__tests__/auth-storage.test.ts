import { AuthManager, MemoryAuthStorage, AuthStorage } from '../auth-storage';

describe('AuthStorage', () => {
  let storage: AuthStorage;

  beforeEach(() => {
    storage = new MemoryAuthStorage();
  });

  test('should save and retrieve token', async () => {
    const token = 'test-token-123';
    
    await storage.saveToken(token);
    const retrievedToken = await storage.getToken();
    
    expect(retrievedToken).toBe(token);
  });

  test('should return null for non-existent token', async () => {
    const token = await storage.getToken();
    expect(token).toBeNull();
  });

  test('should remove token', async () => {
    const token = 'test-token-123';
    
    await storage.saveToken(token);
    await storage.removeToken();
    const retrievedToken = await storage.getToken();
    
    expect(retrievedToken).toBeNull();
  });

  test('should save and retrieve user info', async () => {
    const userInfo = { id: '123', name: 'Test User' };
    
    await storage.saveUserInfo(userInfo);
    const retrievedUserInfo = await storage.getUserInfo();
    
    expect(retrievedUserInfo).toEqual(userInfo);
  });

  test('should clear all data', async () => {
    const token = 'test-token-123';
    const userInfo = { id: '123', name: 'Test User' };
    
    await storage.saveToken(token);
    await storage.saveUserInfo(userInfo);
    await storage.clear();
    
    expect(await storage.getToken()).toBeNull();
    expect(await storage.getUserInfo()).toBeNull();
  });
});

describe('AuthManager', () => {
  let authManager: AuthManager;
  let storage: AuthStorage;

  beforeEach(() => {
    storage = new MemoryAuthStorage();
    authManager = new AuthManager(storage);
  });

  test('should initialize with empty state', () => {
    expect(authManager.isLoggedIn()).toBe(false);
    expect(authManager.getToken()).toBeNull();
    expect(authManager.getUserInfo()).toBeNull();
  });

  test('should login and set authentication state', async () => {
    const token = 'test-token-123';
    const userInfo = { id: '123', name: 'Test User' };
    
    await authManager.login(token, userInfo);
    
    expect(authManager.isLoggedIn()).toBe(true);
    expect(authManager.getToken()).toBe(token);
    expect(authManager.getUserInfo()).toEqual(userInfo);
  });

  test('should logout and clear authentication state', async () => {
    const token = 'test-token-123';
    const userInfo = { id: '123', name: 'Test User' };
    
    await authManager.login(token, userInfo);
    await authManager.logout();
    
    expect(authManager.isLoggedIn()).toBe(false);
    expect(authManager.getToken()).toBeNull();
    expect(authManager.getUserInfo()).toBeNull();
  });

  test('should refresh token', async () => {
    const oldToken = 'old-token-123';
    const newToken = 'new-token-456';
    const userInfo = { id: '123', name: 'Test User' };
    
    await authManager.login(oldToken, userInfo);
    await authManager.refreshToken(newToken);
    
    expect(authManager.getToken()).toBe(newToken);
    expect(authManager.isLoggedIn()).toBe(true);
  });

  test('should throw error when refreshing token without authentication', async () => {
    await expect(authManager.refreshToken('new-token')).rejects.toThrow(
      'Cannot refresh token: not authenticated'
    );
  });

  test('should change storage implementation', async () => {
    const newStorage = new MemoryAuthStorage();
    const token = 'test-token-123';
    const userInfo = { id: '123', name: 'Test User' };
    
    await newStorage.saveToken(token);
    await newStorage.saveUserInfo(userInfo);
    
    authManager.setStorage(newStorage);
    
    // 需要等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(authManager.isLoggedIn()).toBe(true);
    expect(authManager.getToken()).toBe(token);
    expect(authManager.getUserInfo()).toEqual(userInfo);
  });
});