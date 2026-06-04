// Copyright (c) 2025 TikTok Pte. Ltd.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface OpenFileRequest {
  filePath: string;
  mimeType?: string;
}

export interface OpenFileResponse {
  success: boolean;
  message?: string;
}

/**
 * openFile method
 * @param params - The request parameters
 * @param callback - Callback function to handle the response
 */
declare function openFile(params: OpenFileRequest, callback: (result: OpenFileResponse) => void): void;