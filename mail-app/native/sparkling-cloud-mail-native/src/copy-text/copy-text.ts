import pipe from 'net.yzsaas.mail.cloudmailnative';
import type { CopyTextRequest, CopyTextResponse } from './copyText.d';

/**
 * copyText method
 * @param params - The request parameters
 * @param callback - Callback function to handle the response
 * @throws Will call callback with error if text validation fails
 */
export function copyText(params: CopyTextRequest, callback: (result: CopyTextResponse) => void): void {
    // Parameter validation
    if (!params) {
        const errorResponse: CopyTextResponse = {
            code: -1,
            msg: 'Invalid params: params cannot be null or undefined',
        };
        if (typeof callback === 'function') {
            callback(errorResponse);
        }
        return;
    }

    // type-check validation for text
    if (!params.text || typeof params.text !== 'string' || !params.text.trim()) {
        const errorResponse:  = {
            code: -1,
            msg: 'Invalid params: text must be a non-empty string',
        };
        if (typeof callback === 'function') {
            callback(errorResponse);
        }
        return;
    }

    // Callback validation
    if (typeof callback !== 'function') {
        console.error('[CloudMailNative] copyText: callback must be a function');
        return;
    }

    // Pipe call
    pipe.call('CloudMailNative.copyText', {
        text: params.text.trim(),
    }, (v: unknown) => {
        // Type assertion and response normalization
        const response = v as CopyTextResponse;
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