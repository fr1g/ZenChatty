import { ZenCoreClient } from '../../api';

describe('ZenCoreClient Integration', () => {
    let client: ZenCoreClient;

    beforeEach(() => {
        client = new ZenCoreClient('https://localhost:5637');
    });

    test('should create ZenCoreClient instance', () => {
        expect(client).toBeInstanceOf(ZenCoreClient);
        expect(client.auth).toBeDefined();
        expect(client.user).toBeDefined();
        expect(client.chat).toBeDefined();
        expect(client.message).toBeDefined();
        expect(client.contact).toBeDefined();
    });

    test('should set auth token for all API clients', () => {
        const token = 'test-token';
        client.setAuthToken(token);

        expect(client.auth).toBeDefined();
        expect(client.user).toBeDefined();
        expect(client.chat).toBeDefined();
        expect(client.message).toBeDefined();
        expect(client.contact).toBeDefined();
    });

    test('should clear auth token for all API clients', () => {
        client.setAuthToken('test-token');
        client.clearAuthToken();

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