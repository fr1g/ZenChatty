import { ApiClientBase } from './base';
import { BasicResponse } from '../models/auth';
import { FileUploadRequest, FileUploadResponse, FileInfoResponse } from '../models/requests';

export class FileApiClient extends ApiClientBase {
    /**
     * 文件上传
     * @param request - 文件上传请求
     * @returns 文件上传响应
     */
    public async uploadFile(request: FileUploadRequest): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('File', request.file);
        formData.append('FileExtension', request.fileExtension);
        formData.append('ClientCalculatedSha256', request.clientCalculatedSha256);

        return await this.post<FileUploadResponse>('/api/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    /**
     * 获取文件信息
     * @param locator - 文件定位器
     * @returns 文件信息响应
     */
    public async getFileInfo(locator: string): Promise<FileInfoResponse> {
        return await this.get<FileInfoResponse>(`/api/file/info/${locator}`);
    }

    /**
     * 下载文件
     * @param locator - 文件定位器
     * @returns 文件Blob
     */
    public async downloadFile(locator: string): Promise<Blob> {
        return await this.get<Blob>(`/api/file/download/${locator}`, {
            responseType: 'blob',
        });
    }

    public imageFileByUrl(locator: string): string{
        return `${this.baseURL}/api/file/download/${locator}`;
    }

    /**
     * 删除文件 @deprecated
     * @param locator - 文件定位器
     * @returns 基础响应
     */
    public async deleteFile(locator: string): Promise<BasicResponse> {
        return await this.delete<BasicResponse>(`/api/file/delete/${locator}`);
    }
}