import { User, UserInfoResponse, UserAuthObject } from '../../models';

describe('User Models', () => {
  describe('User', () => {
    test('should create User instance with default values', () => {
      const user = new User('test@example.com', 'test1', undefined);
      expect(user).toBeInstanceOf(User);
      expect(user.localId).toBe('');
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('anonymous');
    });

    test('should create User instance with provided values', () => {
      const user = new User('test@example.com', 'test2', 'thisGuy');
      user.localId = '123';
      user.email = 'test@example.com';
      user.displayName = 'Test User';

      expect(user.localId).toBe('123');
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
    });
  });

  describe('UserInfoResponse', () => {
    test('should create UserInfoResponse instance with default values', () => {
      const response = new UserInfoResponse();
      expect(response).toBeInstanceOf(UserInfoResponse);
      expect(response.localId).toBe('');
      expect(response.email).toBeUndefined();
      expect(response.displayName).toBeUndefined();
    });

    test('should create UserInfoResponse instance with provided values', () => {
      const response = new UserInfoResponse();
      response.localId = '456';
      response.email = 'user@example.com';
      response.displayName = 'User Response';

      expect(response.localId).toBe('456');
      expect(response.email).toBe('user@example.com');
      expect(response.displayName).toBe('User Response');
    });
  });

  describe('UserAuthObject', () => {
    test('should create UserAuthObject instance with default values', () => {
      const authObj = new UserAuthObject();
      expect(authObj).toBeInstanceOf(UserAuthObject);
      expect(authObj.userId).toBe('');
      expect(authObj.passwordHash).toBe('');
      expect(authObj.passwordSalt).toBe('');
    });

    test('should create UserAuthObject instance with provided values', () => {
      const authObj = new UserAuthObject();
      authObj.userId = '789';
      authObj.passwordHash = 'hash123';
      authObj.passwordSalt = 'salt456';

      expect(authObj.userId).toBe('789');
      expect(authObj.passwordHash).toBe('hash123');
      expect(authObj.passwordSalt).toBe('salt456');
    });
  });
});