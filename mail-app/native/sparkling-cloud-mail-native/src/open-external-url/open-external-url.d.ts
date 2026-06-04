// Copyright (c) 2025 TikTok Pte. Ltd.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface OpenExternalUrlRequest {
  url: string;
}

export interface OpenExternalUrlResponse {
  success: boolean;
  message?: string;
}

/**
 * openExternalUrl method
 * @param params - The request parameters
 * @param callback - Callback function to handle the response
 */
declare function openExternalUrl(params: OpenExternalUrlRequest, callback: (result: OpenExternalUrlResponse) => void): void;