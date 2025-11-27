import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Tools } from '../tools';

export class ApiClientBase {
    protected client: AxiosInstance;
    protected baseURL: string;

    /**
     * 创建API客户端实例
     * @param baseURL - API基础URL
     * @param timeout - 请求超时时间（毫秒）
     * @param rejectUnauthorized - 是否拒绝无效证书（默认true，设为false可忽略证书错误）
     * @remarks 在前端环境中，证书验证由浏览器控制，此参数主要影响Node.js环境
     */
    constructor(baseURL: string = 'https://localhost:5637', timeout: number = 10000) {
        this.baseURL = baseURL;
        
        // 创建axios配置对象
        const axiosConfig: any = {
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        this.client = axios.create(axiosConfig);

        // 请求拦截器
        this.client.interceptors.request.use(
            (config) => {
                // 可以在这里添加认证token等 // idiot
                // const token = localStorage?.getItem('accessToken'); // this m0therfvcker MIGHT NEVER HAVE LOCALSTORAGE
                // if (token) {
                //     config.headers.Authorization = Tools.bear(token);
                // }
                // if(!config.headers.Authorization) throw new Error() // well this is stupid
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
                console.error('API请求错误详情:', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data,
                    headers: error.config?.headers,
                    responseData: error.response?.data
                });
                
                // 提取后端响应体中的错误信息
                const backendError = error.response?.data;
                if (backendError && typeof backendError === 'object') {
                    // 优先使用后端返回的具体错误信息
                    const errorMessage = backendError.content || backendError.message || backendError.error || error.message;
                    error.message = errorMessage;
                    error.backendResponse = backendError;
                }
                
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
        delete this.client.defaults.headers.common['Authorization']; // really... strict mode will reject it...
    }

    public setDeviceIdInHeader(deviceId: string) {
        this.client.defaults.headers.common['X-Device-Id'] = deviceId;
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