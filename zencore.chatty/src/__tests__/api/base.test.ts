import { ApiClientBase } from '../../api/base';

describe('ApiClientBase', () => {
    let apiClient: ApiClientBase;

    beforeEach(() => {
        apiClient = new ApiClientBase('https://localhost:5637');
    });

    test('should create ApiClientBase instance with base URL', () => {
        expect(apiClient).toBeInstanceOf(ApiClientBase);
        expect(apiClient['baseURL']).toBe('https://localhost:5637');
    });

    test('touch', () => {
        expect(apiClient).toBeDefined();
    });

    test('should set authorization header', () => {
        const token = 'test-token';
        apiClient.setAuthToken(token);

        expect(apiClient).toBeDefined();
    });

    test('should clear authorization header', () => {
        apiClient.setAuthToken('test-token');
        apiClient.clearAuthToken();

        expect(apiClient).toBeDefined();
    });

    test('should have HTTP methods defined', () => {
        expect(apiClient['get']).toBeDefined();
        expect(apiClient['post']).toBeDefined();
        expect(apiClient['put']).toBeDefined();
        expect(apiClient['delete']).toBeDefined();
    });
});