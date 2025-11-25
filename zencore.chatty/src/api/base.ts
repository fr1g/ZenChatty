import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Tools } from '../tools';

export class ApiClientBase {
    protected client: AxiosInstance;
    protected baseURL: string;

    /**
     * 创建API客户端实例
     * @param baseURL - API基础URL
     * @param timeout - 请求超时时间（毫秒）
     */
    constructor(baseURL: string = 'https://localhost:5637', timeout: number = 10000) {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 请求拦截器
        this.client.interceptors.request.use(
            (config) => {
                // 可以在这里添加认证token等
                const token = localStorage?.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = Tools.bear(token);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                // 可以在这里处理通用错误
                console.error('API请求错误:', error);
                return Promise.reject(error);
            }
        );
    }

    /**
     * 设置认证token
     * @param token - JWT token
     */
    public setAuthToken(token: string): void {
        this.client.defaults.headers.common['Authorization'] = Tools.bear(token);
    }

    /**
     * 清除认证token
     */
    public clearAuthToken(): void {
        delete this.client.defaults.headers.common['Authorization'];
    }

    /**
     * GET请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.get(url, config);
        return response.data;
    }

    /**
     * POST请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.post(url, data, config);
        return response.data;
    }

    /**
     * PUT请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.put(url, data, config);
        return response.data;
    }

    /**
     * DELETE请求
     * @param url - 请求URL
     * @param config - Axios配置
     */
    protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.delete(url, config);
        return response.data;
    }

    /**
     * PATCH请求
     * @param url - 请求URL
     * @param data - 请求数据
     * @param config - Axios配置
     */
    protected async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.patch(url, data, config);
        return response.data;
    }
}