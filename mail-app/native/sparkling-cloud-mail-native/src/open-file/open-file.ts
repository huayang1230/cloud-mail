import pipe from 'net.yzsaas.mail.cloudmailnative';
import type { OpenFileRequest, OpenFileResponse } from './openFile.d';

/**
 * openFile method
 * @param params - The request parameters
 * @param callback - Callback function to handle the response
 * @throws Will call callback with error if filePath validation fails
 */
export function openFile(params: OpenFileRequest, callback: (result: OpenFileResponse) => void): void {
    // Parameter validation
    if (!params) {
        const errorResponse: OpenFileResponse = {
            code: -1,
            msg: 'Invalid params: params cannot be null or undefined',
        };
        if (typeof callback === 'function') {
            callback(errorResponse);
        }
        return;
    }

    // type-check validation for filePath
    if (!params.filePath || typeof params.filePath !== 'string' || !params.filePath.trim()) {
        const errorResponse:  = {
            code: -1,
            msg: 'Invalid params: filePath must be a non-empty string',
        };
        if (typeof callback === 'function') {
            callback(errorResponse);
        }
        return;
    }

    // Callback validation
    if (typeof callback !== 'function') {
        console.error('[CloudMailNative] openFile: callback must be a function');
        return;
    }

    // Pipe call
    pipe.call('CloudMailNative.openFile', {
        filePath: params.filePath.trim(),
        mimeType: params.mimeType,
    }, (v: unknown) => {
        // Type assertion and response normalization
        const response = v as OpenFileResponse;
        const code = response?.code ?? -1;
        // Pipe status codes: 1 = succeeded, 0 = failed, negative = various errors.
        // When the native side reports success it may omit `msg`, so fall back to
        // 'ok' instead of the misleading 'Unknown error'.
        const isSuccess = code === 1;
        const msg = response?.msg ?? (isSuccess ? 'ok' : 'Unknown error');
        callback({
            code,
            msg,
        });
    });
}