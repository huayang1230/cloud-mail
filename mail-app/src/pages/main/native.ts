import { chooseMedia, downloadFile } from 'sparkling-media'
import type { TempFile } from 'sparkling-media'
import * as router from 'sparkling-navigation'

import { getExtName } from './services.js'
import type { NativePickedFile } from './mail-types.js'

type CallbackResult<T> = {
  code?: number
  msg?: string
  data?: T
}

function callNative<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const global = globalThis as Record<string, any>
  const direct = global.CloudMailNative || global.cloudMailNative
  if (direct?.[method]) {
    const result = direct[method](params)
    if (result?.then) return result
    return Promise.resolve(result as T)
  }
  const bridge = global.__sparklingNativeBridge || global.SparklingNativeBridge
  if (bridge?.call) {
    return new Promise((resolve, reject) => {
      bridge.call(`CloudMailNative.${method}`, params, (result: CallbackResult<T>) => {
        if (result?.code === 0 || result?.code === 1 || result?.data) resolve((result.data || result) as T)
        else reject(new Error(result?.msg || 'Native bridge failed'))
      })
    })
  }
  return Promise.reject(new Error('Native bridge is not available'))
}

export async function copyText(text: string) {
  await callNative('copyText', { text })
}

export async function openExternalUrl(url: string) {
  try {
    await callNative('openExternalUrl', { url })
  } catch {
    await new Promise<void>((resolve) => {
      router.open({ scheme: url }, () => resolve())
    })
  }
}

export async function openFile(filePath: string, mimeType?: string) {
  await callNative('openFile', { filePath, mimeType })
}

export async function pickFiles(maxCount = 6): Promise<NativePickedFile[]> {
  try {
    return await callNative<NativePickedFile[]>('pickFiles', { maxCount })
  } catch {
    return new Promise((resolve, reject) => {
      chooseMedia(
        {
          mediaTypes: ['image', 'video'],
          sourceType: 'album',
          maxCount,
          isMultiSelect: maxCount > 1,
          needBase64Data: true,
          shouldKeepOriginalFormat: true,
        },
        (result) => {
          if (result.code !== 0) {
            reject(new Error(result.msg || 'Choose media failed'))
            return
          }
          const files = (result.data?.tempFiles || []).map((file: TempFile) => {
            const filePath = file.tempFileAbsolutePath || file.tempFilePath
            const name = filePath.split('/').pop() || `attachment.${file.mediaType === 'image' ? 'jpg' : 'mp4'}`
            return {
              filename: name,
              size: file.size,
              contentType: file.mimeType,
              base64Data: file.base64Data || '',
              filePath,
            }
          })
          resolve(files)
        },
      )
    })
  }
}

export async function downloadAndOpen(url: string, filename: string, mimeType?: string) {
  const extension = getExtName(filename)
  const filePath = await new Promise<string>((resolve, reject) => {
    downloadFile(
      {
        url,
        extension,
        timeoutInterval: 60,
      },
      (result) => {
        if (result.code !== 0 || !result.data?.filePath) {
          reject(new Error(result.msg || 'Download failed'))
          return
        }
        resolve(result.data.filePath)
      },
    )
  })
  try {
    await openFile(filePath, mimeType)
  } catch {
    return filePath
  }
  return filePath
}
