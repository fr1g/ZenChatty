import { EndpointSettings } from "../shared/ApiConfig";
import { UserApiClient } from "zen-core-chatty-typescript";
// @ts-ignore
const localAsset = require('../../assets/default-1r1-placeholder.png');

export async function getImgByLocator(locator: string): Promise<string> {
  if (locator === '') {
    const response = await fetch(localAsset.default || localAsset);
    const blob = await response.blob();
    return await blobToBase64(blob);
  }
  let n = new UserApiClient()

  return await fetchFileAsBase64(`${EndpointSettings.baseUrl}/locate/${locator}`);
}

/**
 * 从给定 URL 下载文件并返回 Blob
 * @param url 服务端文件地址
 * @returns Promise<Blob>
 */
export async function fetchFileAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.status} ${response.statusText}`);
  }
  return await response.blob();
}

export async function fetchFileAsBase64(url: string): Promise<string> {
  const blob = await fetchFileAsBlob(url);
  return await blobToBase64(blob);
}

/**
 * 将 Blob 转换为 Base64 编码的字符串
 * @param blob 要转换的 Blob 对象
 * @returns Promise<string> Base64 编码的字符串
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

