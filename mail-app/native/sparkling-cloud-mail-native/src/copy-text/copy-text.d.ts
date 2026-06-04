// Copyright (c) 2025 TikTok Pte. Ltd.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface CopyTextRequest {
  text: string;
}

export interface CopyTextResponse {
  success: boolean;
  message?: string;
}

/**
 * copyText method
 * @param params - The request parameters
 * @param callback - Callback function to handle the response
 */
declare function copyText(params: CopyTextRequest, callback: (result: CopyTextResponse) => void): void;