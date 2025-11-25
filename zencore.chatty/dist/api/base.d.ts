import { AxiosInstance, AxiosRequestConfig } from 'axios';
export declare class ApiClientBase {
    protected client: AxiosInstance;
    protected baseURL: string;
    /**
     * 创建API客户端实例
     * @param baseURL - API基础URL
     * @param timeout - 请求超时时间（毫秒）
     */
    constructor(baseURL?: string, timeout?: number);
    /**
     * 设置认证token
     * @param token - JWT token
     */
    setAuthToken(token: string): void;
    /**
     * 清除认证token
     */
    clearAuthToken(): void;
    /**
     * GET请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    protected get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * POST请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * PUT请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * DELETE请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    protected delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * PATCH请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}
//# sourceMappingURL=base.d.ts.map