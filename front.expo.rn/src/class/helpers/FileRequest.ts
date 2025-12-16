import { EndpointSettings } from "../shared/ApiConfig";
import { UserApiClient } from "zen-core-chatty-ts";
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
 * Download file from given URL and return Blob
 * @param url Server file address
 * @returns Promise<Blob>
 */
export async function fetchFileAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  return await response.blob();
}

export async function fetchFileAsBase64(url: string): Promise<string> {
  const blob = await fetchFileAsBlob(url);
  return await blobToBase64(blob);
}

/**
 * Convert Blob to Base64 encoded string
 * @param blob Blob object to convert
 * @returns Promise<string> Base64 encoded string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

