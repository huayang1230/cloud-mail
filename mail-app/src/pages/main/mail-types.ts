export type Lang = 'zh' | 'en'

export type ApiResult<T = unknown> = {
  code: number
  message: string
  data: T
}

export type Account = {
  accountId: number
  email: string
  name?: string
  sort?: number
  allReceive?: number
  isDel?: number
  [key: string]: unknown
}

export type User = {
  userId?: number
  email?: string
  name?: string
  permKeys?: string[]
  role?: Record<string, unknown>
  account?: Account
  sendCount?: number
  [key: string]: unknown
}

export type Attachment = {
  attId?: number
  emailId?: number
  filename: string
  size: number
  key?: string
  contentType?: string
  content?: string
  base64Data?: string
  [key: string]: unknown
}

export type EmailTranslation = {
  emailId: number
  targetLang: Lang
  sourceLang?: 'zh' | 'en' | 'other'
  subject?: string
  content?: string
  text?: string
  [key: string]: unknown
}

export type Email = {
  emailId: number
  accountId?: number
  userId?: number
  name?: string
  sendEmail?: string
  toEmail?: string
  recipient?: string
  subject?: string
  sourceLang?: 'zh' | 'en' | 'other' | ''
  text?: string
  content?: string
  createTime?: string | number
  formatCreateTime?: string
  formatText?: string
  type?: number
  status?: number
  unread?: number
  isStar?: number
  isDel?: number
  code?: string
  message?: string
  userEmail?: string
  attList?: Attachment[]
  [key: string]: unknown
}

export type EmailListResult = {
  list: Email[]
  total?: number
  latestEmail?: Email
}

export type MailboxKind = 'inbox' | 'sent' | 'starred' | 'drafts' | 'all-mail'

export type AppView =
  | MailboxKind
  | 'settings'
  | 'management'
  | 'analysis'
  | 'system'

export type ManagementResource = 'users' | 'roles' | 'regKeys'

export type DraftRow = {
  id: string
  createTime: number
  sendEmail?: string
  accountId?: number
  name?: string
  receiveEmail: string[]
  subject: string
  content: string
  text: string
  attachments: Attachment[]
  sendType: ComposerMode
  emailId?: number
}

export type ComposerMode = 'new' | 'reply' | 'forward' | 'draft'

export type ComposeState = {
  open: boolean
  mode: ComposerMode
  email?: Email | null
  draft?: DraftRow | null
  receiveInput: string
  receiveEmail: string[]
  subject: string
  content: string
  attachments: Attachment[]
  sending: boolean
}

export type SettingsMap = Record<string, unknown>

export type ToastLevel = 'info' | 'success' | 'warning' | 'danger'

export type ToastState = {
  text: string
  level: ToastLevel
} | null

export type ConfirmState = {
  title: string
  message: string
  confirmText?: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
} | null

export type NativePickedFile = {
  filename: string
  size: number
  contentType?: string
  base64Data: string
  filePath?: string
}
