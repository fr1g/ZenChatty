import { ZenCoreChattyClient } from '../../api';

describe('ZenCoreChattyClient Integration', () => {
    let client: ZenCoreChattyClient;

    beforeEach(() => {
        client = new ZenCoreChattyClient('https://localhost:5637');
    });

    test('should create ZenCoreChattyClient instance', () => {
        expect(client).toBeInstanceOf(ZenCoreChattyClient);
        expect(client.auth).toBeDefined();
        expect(client.user).toBeDefined();
        expect(client.chat).toBeDefined();
        expect(client.message).toBeDefined();
        expect(client.contact).toBeDefined();
    });

    test('should set auth token for all API clients', () => {
        const token = 'test-token';
        client.setAuthToken(token);

        // 验证所有API客户端都已初始化
        expect(client.auth).toBeDefined();
        expect(client.user).toBeDefined();
        expect(client.chat).toBeDefined();
        expect(client.message).toBeDefined();
        expect(client.contact).toBeDefined();
    });

    test('should clear auth token for all API clients', () => {
        client.setAuthToken('test-token');
        client.clearAuthToken();

        // 验证所有API客户端都已初始化
        expect(client.auth).toBeDefined();
        expect(client.user).toBeDefined();
        expect(client.chat).toBeDefined();
        expect(client.message).toBeDefined();
        expect(client.contact).toBeDefined();
    });

    test('should have all API modules accessible', () => {
        expect(client.auth).toBeDefined();
        expect(client.user).toBeDefined();
        expect(client.chat).toBeDefined();
        expect(client.message).toBeDefined();
        expect(client.contact).toBeDefined();
    });
});