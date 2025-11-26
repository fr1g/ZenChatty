export { AuthManager, MemoryAuthStorage, AuthStorage } from './auth-storage';
export { ReactNativeAuthStorage, WebAuthStorage, SecureAuthStorage, PlatformDetector } from './platform-adapters';
export { Tools, ErrorHandler, DateTimeUtils, StringUtils, ValidationUtils, FileUtils } from './utils';

/**
 * 工具类集合 - 向后兼容的导出
 */
export const ToolsLegacy = {
    bear(token: string) {
        return `Bearer ${token}`;
    },
};