import { getItem, setItem } from 'sparkling-storage'

import type {
  ApiResult,
  Attachment,
  Email,
  EmailListResult,
  Lang,
  SettingsMap,
} from './mail-types.js'

export const API_BASE_URL = 'https://mail.yzsaas.net/api'
const STORAGE_BIZ = 'cloud-mail'

export class MailApiError extends Error {
  code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.name = 'MailApiError'
    this.code = code
  }
}

export type RequestContext = {
  token?: string
  lang: Lang
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, unknown>
  body?: unknown
  noMsg?: boolean
}

export function defaultLang(): Lang {
  const value = String(globalThis.navigator?.language || '')
  return value.startsWith('zh') ? 'zh' : 'en'
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function cleanSpace(value = '') {
  return value
    .replace(/[\u200B-\u200F\uFEFF\u034F\u00A0\u3000\u00AD]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function htmlToText(html?: string, text?: string) {
  if (!html) return cleanSpace(text || '')
  return cleanSpace(
    html
      .replace(/<(script|style|title)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<(img|iframe|object|embed|video|audio|source|link)[^>]*>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  )
}

export function formatDate(value?: string | number) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function getExtName(fileName = '') {
  const index = fileName.lastIndexOf('.')
  return index === -1 ? 'dat' : fileName.slice(index + 1).toLowerCase()
}

export function initials(value?: string) {
  return (value || 'M').trim().slice(0, 1).toUpperCase() || 'M'
}

export function formatRecipients(recipient?: string) {
  if (!recipient) return ''
  try {
    const list = JSON.parse(recipient)
    if (Array.isArray(list)) {
      return list.map((item) => item.address || item.email || item).filter(Boolean).join(', ')
    }
  } catch {
    return recipient
  }
  return recipient
}

export function toOssDomain(domain?: unknown) {
  if (!domain) return ''
  let value = String(domain)
  if (!value.startsWith('http')) value = `https://${value}`
  if (value.endsWith('/')) value = value.slice(0, -1)
  return value
}

export function cvtR2Url(key?: string, settings?: SettingsMap) {
  if (!key) return ''
  if (key.startsWith('https://') || key.startsWith('http://') || key.startsWith('data:')) {
    return key
  }
  const domain = toOssDomain(settings?.r2Domain)
  return domain ? `${domain}/${key}` : key
}

export function normalizeEmail(email: Email): Email {
  return {
    ...email,
    formatText: email.formatText || htmlToText(email.content, email.text),
    formatCreateTime: email.formatCreateTime || formatDate(email.createTime),
    attList: email.attList || [],
  }
}

export function asList<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const obj = data as { list?: T[]; rows?: T[] } | undefined
  if (Array.isArray(obj?.list)) return obj.list
  if (Array.isArray(obj?.rows)) return obj.rows
  return []
}

export function compact(value: unknown) {
  if (value == null || value === '') return '-'
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.join(', ')
    return JSON.stringify(value)
  }
  return String(value)
}

export function extractToken(data: unknown) {
  if (typeof data === 'string') return data
  const row = data as Record<string, unknown> | undefined
  return String(row?.token || row?.Authorization || row?.authorization || '')
}

export function splitEmails(raw: string) {
  return raw
    .split(/[,，;\s\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeAttachments(files: Attachment[]) {
  return files.map((file) => ({
    filename: file.filename,
    size: file.size,
    contentType: file.contentType,
    content: file.content || file.base64Data || '',
  }))
}

function buildUrl(path: string, params?: Record<string, unknown>) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  if (!params) return url
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url
}

function isApiResult(value: unknown): value is ApiResult {
  return !!value && typeof value === 'object' && 'code' in value && 'data' in value
}

export async function apiRequest<T>(
  context: RequestContext,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method || (options.body === undefined ? 'GET' : 'POST')
  const headers: Record<string, string> = {
    'accept-language': context.lang,
  }
  if (context.token) headers.Authorization = context.token
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (error) {
    throw new MailApiError(error instanceof Error ? error.message : 'Network request failed')
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!isApiResult(payload)) {
    if (!response.ok) throw new MailApiError(response.statusText || 'Request failed', response.status)
    return payload as T
  }

  if (payload.code !== 200) {
    throw new MailApiError(payload.message || 'Request failed', payload.code)
  }

  return payload.data as T
}

export function readStore<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    try {
      getItem({ key, biz: STORAGE_BIZ }, (result) => {
        if (result.code !== 1) {
          resolve(fallback)
          return
        }
        const raw = result.data?.data
        if (raw == null || raw === '') {
          resolve(fallback)
          return
        }
        if (typeof raw !== 'string') {
          resolve(raw as T)
          return
        }
        try {
          resolve(JSON.parse(raw) as T)
        } catch {
          resolve(raw as T)
        }
      })
    } catch {
      resolve(fallback)
    }
  })
}

export function writeStore<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      setItem({ key, biz: STORAGE_BIZ, data: JSON.stringify(value) }, (result) => {
        if (result.code === 1) resolve()
        else reject(new Error(result.msg || 'Storage failed'))
      })
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Storage failed'))
    }
  })
}

export function draftStoreKey(userEmail?: string) {
  return `cloud-mail:drafts:${userEmail || 'anonymous'}`
}

export function recipientStoreKey(userEmail?: string) {
  return `cloud-mail:recipients:${userEmail || 'anonymous'}`
}

export function mailboxTitle(kind: string, lang: Lang) {
  const zh: Record<string, string> = {
    inbox: '收件箱',
    sent: '已发送',
    starred: '星标',
    drafts: '草稿',
    'all-mail': '全部邮件',
  }
  const en: Record<string, string> = {
    inbox: 'Inbox',
    sent: 'Sent',
    starred: 'Starred',
    drafts: 'Drafts',
    'all-mail': 'All Mail',
  }
  return (lang === 'zh' ? zh : en)[kind] || kind
}

export function resultList(data: EmailListResult | Email[] | unknown) {
  if (Array.isArray(data)) return data.map(normalizeEmail)
  return asList<Email>(data).map(normalizeEmail)
}
