export interface CopyTextRequest {
  text: string;
}

export interface OpenExternalUrlRequest {
  url: string;
}

export interface PickFilesRequest {
  /**
   * @default 6
   */
  maxCount?: number;
}

export interface PickedFile {
  filename: string;
  size: number;
  contentType?: string;
  base64Data: string;
  filePath?: string;
}

export interface PickFilesResponse {
  files: PickedFile[];
}

export interface OpenFileRequest {
  filePath: string;
  mimeType?: string;
}

export interface CloudMailNativeResponse {
  /**
   * @default true
   */
  success: boolean;
  message?: string;
}

declare function copyText(
  params: CopyTextRequest,
  callback: (result: CloudMailNativeResponse) => void,
): void;

declare function openExternalUrl(
  params: OpenExternalUrlRequest,
  callback: (result: CloudMailNativeResponse) => void,
): void;

declare function pickFiles(
  params: PickFilesRequest,
  callback: (result: PickFilesResponse) => void,
): void;

declare function openFile(
  params: OpenFileRequest,
  callback: (result: CloudMailNativeResponse) => void,
): void;
