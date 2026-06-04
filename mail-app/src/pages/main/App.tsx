import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'
import {
  Button,
  Checkbox,
  DialogBackdrop,
  DialogContent,
  DialogRoot,
  DialogView,
  Input,
  ScrollView,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
  SwipeAction,
  Switch,
  TextArea,
} from '@lynx-js/lynx-ui'

import './App.css'
import { copyText, downloadAndOpen, openExternalUrl, pickFiles } from './native.js'
import type {
  Account,
  AppView,
  Attachment,
  ComposeState,
  ConfirmState,
  DraftRow,
  Email,
  EmailListResult,
  EmailTranslation,
  Lang,
  ManagementResource,
  SettingsMap,
  ToastLevel,
  ToastState,
  User,
} from './mail-types.js'
import {
  apiRequest,
  asList,
  compact,
  cvtR2Url,
  defaultLang,
  draftStoreKey,
  extractToken,
  formatBytes,
  formatDate,
  formatRecipients,
  htmlToText,
  initials,
  isEmail,
  MailApiError,
  mailboxTitle,
  normalizeAttachments,
  normalizeEmail,
  readStore,
  recipientStoreKey,
  resultList,
  splitEmails,
  writeStore,
} from './services.js'

const PAGE_SIZE = 50

const copy = {
  zh: {
    login: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    name: '名称',
    inviteCode: '注册码',
    turnstile: '验证码',
    linuxDo: 'LinuxDo 登录',
    compose: '写信',
    send: '发送',
    saveDraft: '存草稿',
    drafts: '草稿',
    recipient: '收件人',
    subject: '主题',
    content: '正文',
    attachments: '附件',
    addAttachment: '添加附件',
    cancel: '取消',
    save: '保存',
    refresh: '刷新',
    search: '搜索',
    noData: '暂无数据',
    loading: '加载中',
    settings: '设置',
    management: '管理',
    analytics: '分析',
    system: '系统设置',
    language: '语言',
    theme: '深色模式',
    logout: '退出',
    delete: '删除',
    star: '星标',
    unstar: '取消星标',
    reply: '回复',
    forward: '转发',
    translate: '翻译',
    original: '原文',
    read: '已读',
    unread: '未读',
    account: '邮箱账号',
    addAccount: '添加邮箱',
    token: '验证 Token',
    setTop: '置顶',
    allReceive: '全收',
    userInfo: '个人信息',
    changePassword: '修改密码',
    confirmPassword: '确认密码',
    deleteAccount: '删除账号',
    users: '用户',
    roles: '角色',
    regKeys: '注册码',
    add: '新增',
    edit: '编辑',
    role: '角色',
    status: '状态',
    active: '正常',
    banned: '禁用',
    copyInvite: '复制邀请',
    resetSend: '重置发送',
    clearUnused: '清理未用',
    totalReceived: '总收件',
    totalSent: '总发件',
    totalMailboxes: '邮箱数',
    totalUsers: '用户数',
    sentToday: '今日发送',
    sourceRatio: '来源占比',
    recentGrowth: '最近增长',
    site: '站点',
    appearance: '外观',
    mail: '邮件',
    storage: '存储',
    verification: '验证',
    notice: '公告',
    ai: 'AI',
    title: '标题',
    domain: '域名',
    r2Domain: 'R2 域名',
    autoRefresh: '自动刷新',
    enabled: '启用',
    disabled: '停用',
    sendSuccess: '发送成功',
    saveSuccess: '保存成功',
    deleteSuccess: '删除成功',
    copySuccess: '已复制',
    sessionExpired: '登录已失效',
    invalidEmail: '邮箱格式不正确',
    required: '请填写必要信息',
    bridgeMissing: '原生能力尚未就绪',
    externalUrl: '外部链接',
    confirmDelete: '确认删除？',
    dangerousAction: '此操作不可撤销。',
    emptyMailbox: '这里还没有邮件',
    noSelected: '选择一封邮件查看详情',
    loadMore: '加载更多',
    noMore: '没有更多了',
    sender: '发件人',
    time: '时间',
    code: '验证码',
    open: '打开',
    download: '下载',
    passwordMismatch: '两次密码不一致',
    passwordShort: '密码至少 6 位',
    mailboxAdded: '邮箱已添加',
    rowAdded: '已新增',
  },
  en: {
    login: 'Sign in',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    inviteCode: 'Invite code',
    turnstile: 'Verification',
    linuxDo: 'LinuxDo',
    compose: 'Compose',
    send: 'Send',
    saveDraft: 'Save draft',
    drafts: 'Drafts',
    recipient: 'Recipients',
    subject: 'Subject',
    content: 'Body',
    attachments: 'Attachments',
    addAttachment: 'Attach',
    cancel: 'Cancel',
    save: 'Save',
    refresh: 'Refresh',
    search: 'Search',
    noData: 'No data',
    loading: 'Loading',
    settings: 'Settings',
    management: 'Admin',
    analytics: 'Analytics',
    system: 'System',
    language: 'Language',
    theme: 'Dark mode',
    logout: 'Sign out',
    delete: 'Delete',
    star: 'Star',
    unstar: 'Unstar',
    reply: 'Reply',
    forward: 'Forward',
    translate: 'Translate',
    original: 'Original',
    read: 'Read',
    unread: 'Unread',
    account: 'Mailbox',
    addAccount: 'Add mailbox',
    token: 'Verify token',
    setTop: 'Pin',
    allReceive: 'All receive',
    userInfo: 'Profile',
    changePassword: 'Password',
    confirmPassword: 'Confirm password',
    deleteAccount: 'Delete account',
    users: 'Users',
    roles: 'Roles',
    regKeys: 'Invite codes',
    add: 'Add',
    edit: 'Edit',
    role: 'Role',
    status: 'Status',
    active: 'Active',
    banned: 'Banned',
    copyInvite: 'Copy invite',
    resetSend: 'Reset send',
    clearUnused: 'Clear unused',
    totalReceived: 'Received',
    totalSent: 'Sent',
    totalMailboxes: 'Mailboxes',
    totalUsers: 'Users',
    sentToday: 'Sent today',
    sourceRatio: 'Sources',
    recentGrowth: 'Recent growth',
    site: 'Site',
    appearance: 'Appearance',
    mail: 'Mail',
    storage: 'Storage',
    verification: 'Verification',
    notice: 'Notice',
    ai: 'AI',
    title: 'Title',
    domain: 'Domain',
    r2Domain: 'R2 domain',
    autoRefresh: 'Auto refresh',
    enabled: 'Enabled',
    disabled: 'Disabled',
    sendSuccess: 'Sent',
    saveSuccess: 'Saved',
    deleteSuccess: 'Deleted',
    copySuccess: 'Copied',
    sessionExpired: 'Session expired',
    invalidEmail: 'Invalid email',
    required: 'Required fields missing',
    bridgeMissing: 'Native bridge unavailable',
    externalUrl: 'External link',
    confirmDelete: 'Delete this item?',
    dangerousAction: 'This cannot be undone.',
    emptyMailbox: 'No messages here',
    noSelected: 'Select a message',
    loadMore: 'Load more',
    noMore: 'No more',
    sender: 'Sender',
    time: 'Time',
    code: 'Code',
    open: 'Open',
    download: 'Download',
    passwordMismatch: 'Passwords do not match',
    passwordShort: 'Password needs 6+ chars',
    mailboxAdded: 'Mailbox added',
    rowAdded: 'Added',
  },
} as const

function tr(lang: Lang, key: keyof typeof copy.zh) {
  return copy[lang][key] || copy.zh[key] || key
}

function emptyCompose(): ComposeState {
  return {
    open: false,
    mode: 'new',
    email: null,
    draft: null,
    receiveInput: '',
    receiveEmail: [],
    subject: '',
    content: '',
    attachments: [],
    sending: false,
  }
}

function iconFor(view: AppView) {
  const map: Record<AppView, string> = {
    inbox: 'IN',
    sent: 'SE',
    starred: '*',
    drafts: 'DR',
    'all-mail': 'ALL',
    settings: 'SET',
    management: 'ADM',
    analysis: 'AN',
    system: 'SYS',
  }
  return map[view]
}

function isMailboxView(view: AppView) {
  return view === 'inbox' || view === 'sent' || view === 'starred' || view === 'all-mail'
}

function hasPerm(user: User, perm: string | string[]) {
  const keys = user.permKeys || []
  if (keys.includes('*')) return true
  if (Array.isArray(perm)) return perm.some((item) => keys.includes(item))
  return keys.includes(perm)
}

function actionClass(variant: 'primary' | 'ghost' | 'danger' | 'soft' = 'ghost') {
  return `action-button action-button--${variant}`
}

function ActionButton({
  children,
  disabled,
  label,
  onClick,
  variant = 'ghost',
}: {
  children?: ReactNode
  disabled?: boolean
  label: string
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'soft'
}) {
  return (
    <Button className={actionClass(variant)} disabled={disabled} onClick={onClick}>
      <text className="action-button__text">{children || label}</text>
    </Button>
  )
}

function IconButton({
  active,
  danger,
  disabled,
  label,
  onClick,
}: {
  active?: boolean
  danger?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
}) {
  const cls = `icon-button ${active ? 'is-active' : ''} ${danger ? 'is-danger' : ''}`
  return (
    <Button className={cls} disabled={disabled} onClick={onClick}>
      <text className="icon-button__text">{label}</text>
    </Button>
  )
}

function Field({
  label,
  maxLength = 500,
  onInput,
  placeholder,
  type = 'text',
  value,
}: {
  label: string
  maxLength?: number
  onInput: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'digit' | 'password' | 'tel' | 'email'
  value: string
}) {
  return (
    <view className="field">
      <text className="field__label">{label}</text>
      <Input
        className="field__input"
        maxLength={maxLength}
        onInput={(next: string) => onInput(next)}
        placeholder={placeholder || label}
        type={type}
        value={value}
      />
    </view>
  )
}

function TextField({
  label,
  onInput,
  placeholder,
  value,
}: {
  label: string
  onInput: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <view className="field">
      <text className="field__label">{label}</text>
      <TextArea
        className="field__textarea"
        maxLength={120000}
        maxLines={18}
        onInput={(next: string) => onInput(next)}
        placeholder={placeholder || label}
        value={value}
      />
    </view>
  )
}

function SwitchRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <view className="setting-row">
      <text className="setting-row__label">{label}</text>
      <Switch checked={checked} className="switch-root" onChange={onChange}>
        {(state: { checked: boolean }) => (
          <view className={`switch-track ${state.checked ? 'is-on' : ''}`}>
            <view className={`switch-thumb ${state.checked ? 'is-on' : ''}`} />
          </view>
        )}
      </Switch>
    </view>
  )
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <Checkbox checked={checked} className="check-row" onChange={onChange}>
      {(state: { checked?: boolean }) => (
        <view className="check-row__inner">
          <view className={`check-row__box ${state.checked ? 'is-on' : ''}`}>
            <text className="check-row__mark">{state.checked ? '1' : ''}</text>
          </view>
          <text className="check-row__label">{label}</text>
        </view>
      )}
    </Checkbox>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <view className="empty-state">
      <text className="empty-state__icon">CM</text>
      <text className="empty-state__text">{text}</text>
    </view>
  )
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null
  return (
    <view className={`toast toast--${toast.level}`}>
      <text className="toast__text">{toast.text}</text>
    </view>
  )
}

function ConfirmDialog({
  confirm,
  lang,
  onClose,
}: {
  confirm: ConfirmState
  lang: Lang
  onClose: () => void
}) {
  if (!confirm) return null
  return (
    <DialogRoot show={!!confirm} onShowChange={(open: boolean) => !open && onClose()}>
      <DialogView className="dialog-view">
        <DialogBackdrop className="dialog-backdrop" onClick={onClose} />
        <DialogContent className="dialog-content">
          <text className="dialog-title">{confirm.title}</text>
          <text className="dialog-message">{confirm.message}</text>
          <view className="dialog-actions">
            <ActionButton label={tr(lang, 'cancel')} onClick={onClose} />
            <ActionButton
              label={confirm.confirmText || tr(lang, 'delete')}
              onClick={async () => {
                await confirm.onConfirm()
                onClose()
              }}
              variant={confirm.danger ? 'danger' : 'primary'}
            />
          </view>
        </DialogContent>
      </DialogView>
    </DialogRoot>
  )
}

function StatCard({
  label,
  tone = 'blue',
  value,
}: {
  label: string
  tone?: 'blue' | 'green' | 'amber' | 'red'
  value: unknown
}) {
  return (
    <view className={`stat-card stat-card--${tone}`}>
      <text className="stat-card__label">{label}</text>
      <text className="stat-card__value">{Number(value || 0).toLocaleString()}</text>
    </view>
  )
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function App(props: { onMounted?: () => void }) {
  const [booting, setBooting] = useState(true)
  const [token, setToken] = useState('')
  const [lang, setLangState] = useState<Lang>(defaultLang())
  const [dark, setDarkState] = useState(false)
  const [settings, setSettings] = useState<SettingsMap>({
    title: 'Cloud Mail',
    autoRefresh: 0,
    r2Domain: '',
  })
  const [domainList, setDomainList] = useState<string[]>([])
  const [user, setUser] = useState<User>({})
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [view, setView] = useState<AppView>('inbox')
  const [emails, setEmails] = useState<Email[]>([])
  const [mailTotal, setMailTotal] = useState(0)
  const [mailLoading, setMailLoading] = useState(false)
  const [mailFollowing, setMailFollowing] = useState(false)
  const [mailNoMore, setMailNoMore] = useState(false)
  const [timeSort, setTimeSort] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [allMailType, setAllMailType] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [translations, setTranslations] = useState<Record<number, EmailTranslation>>({})
  const [compose, setCompose] = useState<ComposeState>(emptyCompose)
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [recipientRecord, setRecipientRecord] = useState<string[]>([])
  const [toast, setToast] = useState<ToastState>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    inviteCode: '',
    token: '',
  })
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' })
  const [accountForm, setAccountForm] = useState({ email: '', token: '' })
  const [managementResource, setManagementResource] = useState<ManagementResource>('users')
  const [managementRows, setManagementRows] = useState<Record<string, unknown>[]>([])
  const [managementSearch, setManagementSearch] = useState('')
  const [managementLoading, setManagementLoading] = useState(false)
  const [managementSheet, setManagementSheet] = useState(false)
  const [managementForm, setManagementForm] = useState({
    email: '',
    password: '',
    roleId: '',
    roleName: '',
    description: '',
    code: '',
    count: '1',
    expireTime: '',
  })
  const [roleOptions, setRoleOptions] = useState<Record<string, unknown>[]>([])
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [systemForm, setSystemForm] = useState<SettingsMap>({})
  const [systemLoading, setSystemLoading] = useState(false)

  const showToast = useCallback((text: string, level: ToastLevel = 'info') => {
    setToast({ text, level })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setToast(null), 2600)
  }, [])

  const resetSession = useCallback(async () => {
    setToken('')
    setUser({})
    setAccounts([])
    setCurrentAccount(null)
    setSelectedEmail(null)
    setDetailOpen(false)
    setEmails([])
    setDrafts([])
    await writeStore('cloud-mail:token', '').catch(() => null)
  }, [])

  const request = useCallback(
    async <T,>(path: string, options: Parameters<typeof apiRequest<T>>[2] = {}) => {
      try {
        return await apiRequest<T>({ token, lang }, path, options)
      } catch (error) {
        if (error instanceof MailApiError && error.code === 401) {
          await resetSession()
          showToast(tr(lang, 'sessionExpired'), 'warning')
        } else if (!options?.noMsg) {
          showToast(error instanceof Error ? error.message : 'Request failed', 'danger')
        }
        throw error
      }
    },
    [lang, resetSession, showToast, token],
  )

  const currentAccountId = currentAccount?.accountId || 0
  const sender = useMemo(() => {
    if (currentAccount?.email) {
      return {
        sendEmail: currentAccount.email,
        accountId: currentAccount.accountId,
        name: currentAccount.name || user.name || currentAccount.email,
      }
    }
    return {
      sendEmail: user.email || '',
      accountId: user.account?.accountId || 0,
      name: user.name || user.email || '',
    }
  }, [currentAccount, user])

  async function loadWebsiteConfig(nextToken: string, nextLang: Lang) {
    const data = await apiRequest<SettingsMap>({ token: nextToken, lang: nextLang }, '/setting/websiteConfig', {
      noMsg: true,
    }).catch(() => null)
    if (!data) return
    setSettings((current) => ({ ...current, ...data }))
    setDomainList(Array.isArray(data.domainList) ? (data.domainList as string[]) : [])
  }

  async function loadSession(nextToken: string, nextLang: Lang) {
    const ctx = { token: nextToken, lang: nextLang }
    const nextUser = await apiRequest<User>(ctx, '/my/loginUserInfo', { noMsg: true })
    const accountData = await apiRequest<EmailListResult | Account[]>(ctx, '/account/list', {
      params: { accountId: 0, size: 50 },
      noMsg: true,
    }).catch(() => [])
    const list = asList<Account>(accountData)
    const savedAccountId = await readStore<number>('cloud-mail:accountId', 0)
    const selected =
      list.find((item) => item.accountId === savedAccountId) ||
      list.find((item) => item.accountId === nextUser.account?.accountId) ||
      nextUser.account ||
      list[0] ||
      null
    setUser(nextUser || {})
    setAccounts(list)
    setCurrentAccount(selected)
    const savedDrafts = await readStore<DraftRow[]>(draftStoreKey(nextUser.email), [])
    const savedRecipients = await readStore<string[]>(recipientStoreKey(nextUser.email), [])
    setDrafts(Array.isArray(savedDrafts) ? savedDrafts : [])
    setRecipientRecord(Array.isArray(savedRecipients) ? savedRecipients : [])
  }

  useEffect(() => {
    let active = true
    async function boot() {
      const savedLang = await readStore<Lang>('cloud-mail:lang', defaultLang())
      const savedDark = await readStore<boolean>('cloud-mail:dark', false)
      const savedToken = await readStore<string>('cloud-mail:token', '')
      if (!active) return
      setLangState(savedLang)
      setDarkState(!!savedDark)
      await loadWebsiteConfig(savedToken, savedLang)
      if (savedToken) {
        setToken(savedToken)
        await loadSession(savedToken, savedLang).catch(async () => {
          await writeStore('cloud-mail:token', '').catch(() => null)
          setToken('')
        })
      }
      if (active) setBooting(false)
      props.onMounted?.()
    }
    boot()
    return () => {
      active = false
    }
  }, [props])

  const loadEmails = useCallback(
    async (append = false) => {
      if (!token || !isMailboxView(view)) return
      if (view !== 'starred' && view !== 'all-mail' && !currentAccountId) return
      if (append && (mailFollowing || mailNoMore || !emails.length)) return
      append ? setMailFollowing(true) : setMailLoading(true)
      try {
        const cursor = append ? emails[emails.length - 1]?.emailId || 0 : 0
        let data: EmailListResult | Email[]
        if (view === 'starred') {
          data = await request('/star/list', { params: { emailId: cursor, size: PAGE_SIZE } })
        } else if (view === 'all-mail') {
          data = await request('/allEmail/list', {
            params: {
              emailId: cursor,
              size: PAGE_SIZE,
              timeSort,
              type: allMailType,
              subject: searchText,
              accountEmail: searchText,
              userEmail: searchText,
              name: searchText,
            },
          })
        } else {
          data = await request('/email/list', {
            params: {
              accountId: currentAccountId,
              allReceive: currentAccount?.allReceive || 0,
              emailId: cursor,
              timeSort,
              size: PAGE_SIZE,
              type: view === 'sent' ? 1 : 0,
            },
          })
        }
        const list = resultList(data)
        setMailNoMore(list.length < PAGE_SIZE)
        setMailTotal(Array.isArray(data) ? (append ? mailTotal + list.length : list.length) : data.total || list.length)
        setEmails((current) => {
          if (!append) return list
          const seen = new Set(current.map((item) => item.emailId))
          return [...current, ...list.filter((item) => !seen.has(item.emailId))]
        })
      } finally {
        append ? setMailFollowing(false) : setMailLoading(false)
      }
    },
    [
      allMailType,
      currentAccount?.allReceive,
      currentAccountId,
      emails,
      mailFollowing,
      mailNoMore,
      mailTotal,
      request,
      searchText,
      timeSort,
      token,
      view,
    ],
  )

  useEffect(() => {
    if (token && isMailboxView(view)) {
      setSelectedEmail(null)
      setDetailOpen(false)
      loadEmails(false)
    }
  }, [currentAccountId, timeSort, allMailType, view])

  useEffect(() => {
    const autoRefresh = Number(settings.autoRefresh || 0)
    if (!token || autoRefresh <= 1 || view === 'sent' || view === 'starred') return
    const timer = setInterval(() => {
      if (isMailboxView(view)) loadEmails(false).catch(() => null)
    }, Math.max(autoRefresh, 3) * 1000)
    return () => clearInterval(timer)
  }, [loadEmails, settings.autoRefresh, token, view])

  useEffect(() => {
    if (view === 'analysis' && token) loadAnalysis()
    if (view === 'management' && token) loadManagement()
    if (view === 'system' && token) loadSystemSettings()
  }, [managementResource, token, view])

  async function persistLang(next: Lang) {
    setLangState(next)
    await writeStore('cloud-mail:lang', next).catch(() => null)
  }

  async function persistDark(next: boolean) {
    setDarkState(next)
    await writeStore('cloud-mail:dark', next).catch(() => null)
  }

  async function loginOrRegister() {
    if (!isEmail(authForm.email) || !authForm.password) {
      showToast(tr(lang, !isEmail(authForm.email) ? 'invalidEmail' : 'required'), 'warning')
      return
    }
    const path = authMode === 'login' ? '/login' : '/register'
    const data = await apiRequest<unknown>({ token: '', lang }, path, {
      body:
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password, token: authForm.token }
          : {
              email: authForm.email,
              password: authForm.password,
              name: authForm.name,
              inviteCode: authForm.inviteCode,
              token: authForm.token,
            },
    })
    const nextToken = extractToken(data)
    if (!nextToken) {
      showToast(tr(lang, 'required'), 'warning')
      return
    }
    setToken(nextToken)
    await writeStore('cloud-mail:token', nextToken).catch(() => null)
    await loadWebsiteConfig(nextToken, lang)
    await loadSession(nextToken, lang)
    setView('inbox')
  }

  async function logout() {
    await request('/logout', { method: 'DELETE', noMsg: true }).catch(() => null)
    await resetSession()
  }

  function openComposer(mode: ComposeState['mode'] = 'new', email?: Email, draft?: DraftRow) {
    if (mode === 'reply' && email) {
      setCompose({
        open: true,
        mode,
        email,
        draft: null,
        receiveInput: '',
        receiveEmail: email.sendEmail ? [email.sendEmail] : [],
        subject: /^Re[:：]/i.test(email.subject || '') ? email.subject || '' : `Re: ${email.subject || ''}`,
        content: `\n\n${formatDate(email.createTime)} ${email.name || email.sendEmail || ''} wrote:\n> ${htmlToText(
          email.content,
          email.text,
        )}`,
        attachments: [],
        sending: false,
      })
      return
    }
    if (mode === 'forward' && email) {
      setCompose({
        open: true,
        mode,
        email,
        draft: null,
        receiveInput: '',
        receiveEmail: [],
        subject: /^Fwd[:：]/i.test(email.subject || '') ? email.subject || '' : `Fwd: ${email.subject || ''}`,
        content: htmlToText(email.content, email.text),
        attachments: [],
        sending: false,
      })
      return
    }
    if (mode === 'draft' && draft) {
      setCompose({
        open: true,
        mode,
        email: null,
        draft,
        receiveInput: '',
        receiveEmail: draft.receiveEmail,
        subject: draft.subject,
        content: draft.content || draft.text,
        attachments: draft.attachments,
        sending: false,
      })
      return
    }
    setCompose({ ...emptyCompose(), open: true })
  }

  function addRecipients(raw = compose.receiveInput) {
    const parts = splitEmails(raw)
    const valid = parts.filter(isEmail)
    if (valid.length !== parts.length) showToast(tr(lang, 'invalidEmail'), 'warning')
    setCompose((current) => ({
      ...current,
      receiveInput: '',
      receiveEmail: Array.from(new Set([...current.receiveEmail, ...valid])),
    }))
  }

  async function saveDraft() {
    const id = compose.draft?.id || `${Date.now()}-${Math.round(Math.random() * 100000)}`
    const row: DraftRow = {
      id,
      createTime: Date.now(),
      sendEmail: sender.sendEmail,
      accountId: sender.accountId,
      name: sender.name,
      receiveEmail: compose.receiveEmail,
      subject: compose.subject,
      content: compose.content,
      text: compose.content,
      attachments: compose.attachments,
      sendType: compose.mode,
      emailId: compose.email?.emailId || compose.draft?.emailId || 0,
    }
    const next = [row, ...drafts.filter((item) => item.id !== id)]
    setDrafts(next)
    await writeStore(draftStoreKey(user.email), next).catch(() => null)
    setCompose(emptyCompose())
    showToast(tr(lang, 'saveSuccess'), 'success')
  }

  async function sendCompose() {
    if (!compose.receiveEmail.length || !compose.subject || !compose.content) {
      showToast(tr(lang, 'required'), 'warning')
      return
    }
    setCompose((current) => ({ ...current, sending: true }))
    try {
      await request('/email/send', {
        body: {
          ...sender,
          receiveEmail: compose.receiveEmail,
          subject: compose.subject,
          content: compose.content,
          text: compose.content,
          attachments: normalizeAttachments(compose.attachments),
          sendType: compose.mode === 'reply' || compose.mode === 'forward' ? compose.mode : '',
          emailId: compose.email?.emailId || compose.draft?.emailId || 0,
        },
        noMsg: true,
      })
      const nextRecipients = Array.from(
        new Set([...compose.receiveEmail, ...recipientRecord.filter((item) => !compose.receiveEmail.includes(item))]),
      ).slice(0, 500)
      setRecipientRecord(nextRecipients)
      await writeStore(recipientStoreKey(user.email), nextRecipients).catch(() => null)
      if (compose.draft) {
        const nextDrafts = drafts.filter((item) => item.id !== compose.draft?.id)
        setDrafts(nextDrafts)
        await writeStore(draftStoreKey(user.email), nextDrafts).catch(() => null)
      }
      setCompose(emptyCompose())
      showToast(tr(lang, 'sendSuccess'), 'success')
      if (view === 'sent') loadEmails(false).catch(() => null)
    } finally {
      setCompose((current) => ({ ...current, sending: false }))
    }
  }

  async function attachFiles() {
    const files = await pickFiles(6).catch((error) => {
      showToast(error instanceof Error ? error.message : tr(lang, 'bridgeMissing'), 'warning')
      return []
    })
    if (!files.length) return
    setCompose((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        ...files.map((file) => ({
          filename: file.filename,
          size: file.size,
          contentType: file.contentType,
          base64Data: file.base64Data,
          content: file.base64Data,
        })),
      ],
    }))
  }

  async function openEmail(email: Email) {
    const next = normalizeEmail(email)
    setSelectedEmail(next)
    setDetailOpen(true)
    if (view === 'inbox' && next.unread === 1) {
      setEmails((current) => current.map((item) => (item.emailId === next.emailId ? { ...item, unread: 0 } : item)))
      await request('/email/read', { method: 'PUT', body: { emailIds: [next.emailId] }, noMsg: true }).catch(() => null)
    }
  }

  async function toggleStar(email: Email) {
    const nextValue = email.isStar ? 0 : 1
    setEmails((current) =>
      current
        .map((item) => (item.emailId === email.emailId ? { ...item, isStar: nextValue } : item))
        .filter((item) => (view === 'starred' ? item.isStar : true)),
    )
    setSelectedEmail((current) => (current?.emailId === email.emailId ? { ...current, isStar: nextValue } : current))
    if (nextValue) await request('/star/add', { body: { emailId: email.emailId } })
    else await request('/star/cancel', { method: 'DELETE', params: { emailId: email.emailId } })
  }

  function askDeleteEmail(email: Email) {
    setConfirm({
      title: tr(lang, 'confirmDelete'),
      message: tr(lang, 'dangerousAction'),
      danger: true,
      onConfirm: async () => {
        if (view === 'all-mail') {
          await request(`/allEmail/delete?emailIds=${email.emailId}`, { method: 'DELETE' })
        } else {
          await request(`/email/delete?emailIds=${email.emailId}`, { method: 'DELETE' })
        }
        setEmails((current) => current.filter((item) => item.emailId !== email.emailId))
        setSelectedEmail(null)
        setDetailOpen(false)
        showToast(tr(lang, 'deleteSuccess'), 'success')
      },
    })
  }

  async function translateEmail(email: Email) {
    if (translations[email.emailId]) {
      setTranslations((current) => {
        const next = { ...current }
        delete next[email.emailId]
        return next
      })
      return
    }
    const data = await request<EmailTranslation>('/email/translate', {
      body: { emailId: email.emailId, targetLang: lang },
      noMsg: true,
    })
    setTranslations((current) => ({ ...current, [email.emailId]: data }))
  }

  async function copyCode(code?: string) {
    if (!code) return
    try {
      await copyText(code)
      showToast(tr(lang, 'copySuccess'), 'success')
    } catch {
      showToast(`${tr(lang, 'bridgeMissing')}: ${code}`, 'warning')
    }
  }

  async function downloadAttachment(att: Attachment) {
    const url = cvtR2Url(att.key, settings)
    if (!url) return
    const filePath = await downloadAndOpen(url, att.filename, att.contentType).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Download failed', 'danger')
      return ''
    })
    if (filePath) showToast(filePath, 'success')
  }

  async function selectAccount(account: Account) {
    setCurrentAccount(account)
    await writeStore('cloud-mail:accountId', account.accountId).catch(() => null)
  }

  async function loadAccounts() {
    const data = await request<EmailListResult | Account[]>('/account/list', {
      params: { accountId: 0, size: 50 },
      noMsg: true,
    })
    const list = asList<Account>(data)
    setAccounts(list)
    if (!currentAccount && list[0]) await selectAccount(list[0])
  }

  async function addAccount() {
    if (!isEmail(accountForm.email)) {
      showToast(tr(lang, 'invalidEmail'), 'warning')
      return
    }
    await request('/account/add', { body: accountForm })
    setAccountForm({ email: '', token: '' })
    await loadAccounts()
    showToast(tr(lang, 'mailboxAdded'), 'success')
  }

  async function deleteAccount(account: Account) {
    setConfirm({
      title: tr(lang, 'confirmDelete'),
      message: account.email,
      danger: true,
      onConfirm: async () => {
        await request('/account/delete', { method: 'DELETE', params: { accountId: account.accountId } })
        await loadAccounts()
      },
    })
  }

  async function resetPassword() {
    if (passwordForm.password.length < 6) {
      showToast(tr(lang, 'passwordShort'), 'warning')
      return
    }
    if (passwordForm.password !== passwordForm.confirm) {
      showToast(tr(lang, 'passwordMismatch'), 'warning')
      return
    }
    await request('/my/resetPassword', { method: 'PUT', body: { password: passwordForm.password } })
    setPasswordForm({ password: '', confirm: '' })
    showToast(tr(lang, 'saveSuccess'), 'success')
  }

  async function deleteUser() {
    setConfirm({
      title: tr(lang, 'deleteAccount'),
      message: tr(lang, 'dangerousAction'),
      danger: true,
      onConfirm: async () => {
        await request('/my/delete', { method: 'DELETE' })
        await resetSession()
      },
    })
  }

  async function loadManagement() {
    setManagementLoading(true)
    try {
      if (managementResource === 'users') {
        const [rows, roles] = await Promise.all([
          request<Record<string, unknown>>('/user/list', {
            params: { email: managementSearch, num: 0, size: 50 },
            noMsg: true,
          }),
          request<Record<string, unknown>[] | Record<string, unknown>>('/role/selectUse', { noMsg: true }).catch(
            () => [],
          ),
        ])
        setManagementRows(asList<Record<string, unknown>>(rows))
        setRoleOptions(asList<Record<string, unknown>>(roles))
      }
      if (managementResource === 'roles') {
        const rows = await request<Record<string, unknown>[] | Record<string, unknown>>('/role/list', { noMsg: true })
        setManagementRows(asList<Record<string, unknown>>(rows))
      }
      if (managementResource === 'regKeys') {
        const [rows, roles] = await Promise.all([
          request<Record<string, unknown>>('/regKey/list', {
            params: { code: managementSearch, num: 0, size: 50 },
            noMsg: true,
          }),
          request<Record<string, unknown>[] | Record<string, unknown>>('/role/selectUse', { noMsg: true }).catch(
            () => [],
          ),
        ])
        setManagementRows(asList<Record<string, unknown>>(rows))
        setRoleOptions(asList<Record<string, unknown>>(roles))
      }
    } finally {
      setManagementLoading(false)
    }
  }

  async function addManagementRow() {
    if (managementResource === 'users') {
      if (!isEmail(managementForm.email) || !managementForm.password) {
        showToast(tr(lang, 'required'), 'warning')
        return
      }
      await request('/user/add', {
        body: {
          email: managementForm.email,
          password: managementForm.password,
          type: Number(managementForm.roleId || 0),
        },
      })
    }
    if (managementResource === 'roles') {
      if (!managementForm.roleName) {
        showToast(tr(lang, 'required'), 'warning')
        return
      }
      await request('/role/add', {
        body: {
          name: managementForm.roleName,
          description: managementForm.description,
          banEmail: [],
          availDomain: [],
          sort: 0,
          sendType: 'count',
          sendCount: 0,
          accountCount: 0,
          permIds: [],
        },
      })
    }
    if (managementResource === 'regKeys') {
      await request('/regKey/add', {
        body: {
          code: managementForm.code,
          roleId: Number(managementForm.roleId || 0),
          count: Number(managementForm.count || 1),
          expireTime: managementForm.expireTime || null,
        },
      })
    }
    setManagementSheet(false)
    setManagementForm({
      email: '',
      password: '',
      roleId: '',
      roleName: '',
      description: '',
      code: '',
      count: '1',
      expireTime: '',
    })
    await loadManagement()
    showToast(tr(lang, 'rowAdded'), 'success')
  }

  function deleteManagementRow(row: Record<string, unknown>) {
    setConfirm({
      title: tr(lang, 'confirmDelete'),
      message: compact(row.email || row.name || row.code || row.roleId || row.userId),
      danger: true,
      onConfirm: async () => {
        if (managementResource === 'users') {
          await request('/user/delete', { method: 'DELETE', params: { userIds: row.userId } })
        }
        if (managementResource === 'roles') {
          await request('/role/delete', { method: 'DELETE', params: { roleId: row.roleId } })
        }
        if (managementResource === 'regKeys') {
          await request(`/regKey/delete?regKeyIds=${row.regKeyId}`, { method: 'DELETE' })
        }
        await loadManagement()
      },
    })
  }

  async function copyInvite(row: Record<string, unknown>) {
    const code = String(row.code || '')
    try {
      await copyText(`Cloud Mail invite code: ${code}`)
      showToast(tr(lang, 'copySuccess'), 'success')
    } catch {
      showToast(code, 'warning')
    }
  }

  async function loadAnalysis() {
    setAnalysisLoading(true)
    try {
      const timezone = 'Asia/Shanghai'
      const data = await request<Record<string, unknown>>('/analysis/echarts', {
        params: { timeZone: timezone },
        noMsg: true,
      })
      setAnalysis(data)
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function loadSystemSettings() {
    setSystemLoading(true)
    try {
      const data = await request<SettingsMap>('/setting/query', { noMsg: true })
      setSystemForm(data || {})
      setSettings((current) => ({ ...current, ...data }))
      setDomainList(Array.isArray(data?.domainList) ? (data.domainList as string[]) : domainList)
    } finally {
      setSystemLoading(false)
    }
  }

  async function saveSystemPatch(keys: string[]) {
    const patch = keys.reduce<SettingsMap>((acc, key) => {
      acc[key] = systemForm[key]
      return acc
    }, {})
    await request('/setting/set', { method: 'PUT', body: patch })
    setSettings((current) => ({ ...current, ...patch }))
    showToast(tr(lang, 'saveSuccess'), 'success')
  }

  const appClass = `cloud-mail-app ${dark ? 'theme-dark' : 'theme-light'}`

  if (booting) {
    return (
      <view className={appClass}>
        <view className="boot">
          <text className="brand-mark">CM</text>
          <text className="boot__title">Cloud Mail</text>
          <text className="muted">{tr(lang, 'loading')}</text>
        </view>
      </view>
    )
  }

  if (!token) {
    return (
      <view className={appClass}>
        <ScrollView className="auth-scroll" scrollOrientation="vertical">
          <view className="auth-page">
            <view className="auth-brand">
              <text className="brand-mark">CM</text>
              <text className="auth-title">Cloud Mail</text>
              <text className="auth-subtitle">mail.yzsaas.net</text>
            </view>
            <view className="auth-card">
              <view className="segmented">
                <ActionButton
                  label={tr(lang, 'login')}
                  onClick={() => setAuthMode('login')}
                  variant={authMode === 'login' ? 'primary' : 'soft'}
                />
                <ActionButton
                  label={tr(lang, 'register')}
                  onClick={() => setAuthMode('register')}
                  variant={authMode === 'register' ? 'primary' : 'soft'}
                />
              </view>
              <Field
                label={tr(lang, 'email')}
                onInput={(email) => setAuthForm((form) => ({ ...form, email }))}
                type="email"
                value={authForm.email}
              />
              <Field
                label={tr(lang, 'password')}
                onInput={(password) => setAuthForm((form) => ({ ...form, password }))}
                type="password"
                value={authForm.password}
              />
              {authMode === 'register' ? (
                <view className="form-stack">
                  <Field
                    label={tr(lang, 'name')}
                    onInput={(name) => setAuthForm((form) => ({ ...form, name }))}
                    value={authForm.name}
                  />
                  <Field
                    label={tr(lang, 'inviteCode')}
                    onInput={(inviteCode) => setAuthForm((form) => ({ ...form, inviteCode }))}
                    value={authForm.inviteCode}
                  />
                </view>
              ) : null}
              <Field
                label={tr(lang, 'turnstile')}
                onInput={(value) => setAuthForm((form) => ({ ...form, token: value }))}
                value={authForm.token}
              />
              <ActionButton label={tr(lang, authMode)} onClick={loginOrRegister} variant="primary" />
              <ActionButton
                label={tr(lang, 'linuxDo')}
                onClick={() => openExternalUrl('https://connect.linux.do/oauth2/authorize').catch(() => null)}
                variant="soft"
              />
              <view className="language-row">
                <ActionButton label="简体中文" onClick={() => persistLang('zh')} variant={lang === 'zh' ? 'primary' : 'soft'} />
                <ActionButton label="English" onClick={() => persistLang('en')} variant={lang === 'en' ? 'primary' : 'soft'} />
              </view>
            </view>
          </view>
        </ScrollView>
        <Toast toast={toast} />
      </view>
    )
  }

  return (
    <view className={appClass}>
      <view className="app-header">
        <view className="header-left">
          <text className="brand-mark brand-mark--small">CM</text>
          <view className="header-title">
            <text className="header-title__main">{String(settings.title || 'Cloud Mail')}</text>
            <text className="header-title__sub">{currentAccount?.email || user.email || '-'}</text>
          </view>
        </view>
        <ActionButton label={tr(lang, 'compose')} onClick={() => openComposer()} variant="primary" />
      </view>

      <ScrollView className="nav-strip" scrollOrientation="horizontal">
        <view className="nav-strip__inner">
          {(['inbox', 'sent', 'starred', 'drafts', 'all-mail'] as AppView[]).map((item) => (
            <Button
              className={`nav-pill ${view === item ? 'is-active' : ''}`}
              key={item}
              onClick={() => setView(item)}
            >
              <text className="nav-pill__icon">{iconFor(item)}</text>
              <text className="nav-pill__text">{mailboxTitle(item, lang)}</text>
            </Button>
          ))}
          <Button className={`nav-pill ${view === 'settings' ? 'is-active' : ''}`} onClick={() => setView('settings')}>
            <text className="nav-pill__icon">{iconFor('settings')}</text>
            <text className="nav-pill__text">{tr(lang, 'settings')}</text>
          </Button>
          {hasPerm(user, ['user:query', 'role:query', 'regKey:query']) ? (
            <Button className={`nav-pill ${view === 'management' ? 'is-active' : ''}`} onClick={() => setView('management')}>
              <text className="nav-pill__icon">{iconFor('management')}</text>
              <text className="nav-pill__text">{tr(lang, 'management')}</text>
            </Button>
          ) : null}
          {hasPerm(user, 'analysis:query') ? (
            <Button className={`nav-pill ${view === 'analysis' ? 'is-active' : ''}`} onClick={() => setView('analysis')}>
              <text className="nav-pill__icon">{iconFor('analysis')}</text>
              <text className="nav-pill__text">{tr(lang, 'analytics')}</text>
            </Button>
          ) : null}
          {hasPerm(user, 'setting:query') ? (
            <Button className={`nav-pill ${view === 'system' ? 'is-active' : ''}`} onClick={() => setView('system')}>
              <text className="nav-pill__icon">{iconFor('system')}</text>
              <text className="nav-pill__text">{tr(lang, 'system')}</text>
            </Button>
          ) : null}
        </view>
      </ScrollView>

      <view className="content-shell">
        {isMailboxView(view) ? renderMailbox() : null}
        {view === 'drafts' ? renderDrafts() : null}
        {view === 'settings' ? renderSettings() : null}
        {view === 'management' ? renderManagement() : null}
        {view === 'analysis' ? renderAnalysis() : null}
        {view === 'system' ? renderSystem() : null}
      </view>

      {renderDetailSheet()}
      {renderComposerSheet()}
      {renderManagementSheet()}
      <ConfirmDialog confirm={confirm} lang={lang} onClose={() => setConfirm(null)} />
      <Toast toast={toast} />
    </view>
  )

  function renderMailbox() {
    const title = mailboxTitle(view, lang)
    return (
      <view className="page">
        <view className="toolbar">
          <view className="toolbar__title">
            <text className="page-title">{title}</text>
            <text className="page-subtitle">{mailTotal || emails.length}</text>
          </view>
          <view className="toolbar__actions">
            <IconButton label={timeSort ? 'AZ' : 'ZA'} onClick={() => setTimeSort((value) => (value ? 0 : 1))} />
            <IconButton label="R" onClick={() => loadEmails(false)} />
          </view>
        </view>

        <ScrollView className="account-strip" scrollOrientation="horizontal">
          <view className="account-strip__inner">
            {accounts.map((account) => (
              <Button
                className={`account-chip ${currentAccountId === account.accountId ? 'is-active' : ''}`}
                key={account.accountId}
                onClick={() => selectAccount(account)}
              >
                <text className="account-chip__name">{account.name || account.email}</text>
                <text className="account-chip__mail">{account.email}</text>
              </Button>
            ))}
          </view>
        </ScrollView>

        <view className="search-row">
          <Input
            className="search-input"
            confirmType="search"
            onConfirm={() => loadEmails(false)}
            onInput={(value: string) => setSearchText(value)}
            placeholder={`${tr(lang, 'search')} ${title}`}
            value={searchText}
          />
          <ActionButton label={tr(lang, 'search')} onClick={() => loadEmails(false)} variant="soft" />
        </view>

        {view === 'all-mail' ? (
          <ScrollView className="filter-strip" scrollOrientation="horizontal">
            <view className="filter-strip__inner">
              {[
                ['', lang === 'zh' ? '全部' : 'All'],
                ['receive', tr(lang, 'totalReceived')],
                ['send', tr(lang, 'totalSent')],
                ['delete', tr(lang, 'delete')],
                ['noone', '-'],
              ].map(([value, label]) => (
                <ActionButton
                  key={value || 'all'}
                  label={label}
                  onClick={() => setAllMailType(value)}
                  variant={allMailType === value ? 'primary' : 'soft'}
                />
              ))}
            </view>
          </ScrollView>
        ) : null}

        <ScrollView className="mail-list" scrollOrientation="vertical">
          {mailLoading ? (
            <EmptyState text={tr(lang, 'loading')} />
          ) : emails.length ? (
            <view className="mail-list__inner">
              {emails.map((email) => renderMailRow(email))}
              <ActionButton
                disabled={mailFollowing || mailNoMore}
                label={mailNoMore ? tr(lang, 'noMore') : tr(lang, 'loadMore')}
                onClick={() => loadEmails(true)}
                variant="soft"
              />
            </view>
          ) : (
            <EmptyState text={tr(lang, 'emptyMailbox')} />
          )}
        </ScrollView>
      </view>
    )
  }

  function renderMailRow(email: Email) {
    const unread = view === 'inbox' && email.unread === 1
    const display = normalizeEmail(email)
    return (
      <SwipeAction
        actionArea={
          <view className="swipe-area">
            <text className="swipe-area__text">{tr(lang, 'delete')}</text>
          </view>
        }
        displayArea={
          <Button className={`mail-row ${unread ? 'is-unread' : ''}`} onClick={() => openEmail(display)}>
            <view className="mail-avatar">
              <text className="mail-avatar__text">{initials(display.name || display.sendEmail)}</text>
            </view>
            <view className="mail-row__body">
              <view className="mail-row__top">
                <text className="mail-row__sender">{display.name || display.sendEmail || '-'}</text>
                <text className="mail-row__time">{display.formatCreateTime}</text>
              </view>
              <text className="mail-row__subject">{display.subject || tr(lang, 'subject')}</text>
              <text className="mail-row__preview">{display.formatText || display.text || ''}</text>
              <view className="mail-row__meta">
                {display.isStar ? <text className="tag tag--amber">{tr(lang, 'star')}</text> : null}
                {display.code ? <text className="tag tag--green">{tr(lang, 'code')}: {display.code}</text> : null}
                {display.attList?.length ? <text className="tag">{display.attList.length} {tr(lang, 'attachments')}</text> : null}
              </view>
            </view>
          </Button>
        }
        enableSwipe={hasPerm(user, 'email:delete')}
        estimatedActionAreaSize={92}
        onAction={() => askDeleteEmail(display)}
        swipeActionId={`mail-${display.emailId}`}
      />
    )
  }

  function renderDetailSheet() {
    const email = selectedEmail
    const translated = email ? translations[email.emailId] : null
    const subject = translated?.subject || email?.subject || tr(lang, 'subject')
    const body = translated ? htmlToText(translated.content, translated.text) : htmlToText(email?.content, email?.text)
    return (
      <SheetRoot
        show={detailOpen}
        side="bottom"
        snapPoints={['92%']}
        onShowChange={(open: boolean) => {
          setDetailOpen(open)
          if (!open) setSelectedEmail(null)
        }}
      >
        <SheetView className="sheet-view">
          <SheetBackdrop className="sheet-backdrop" onClick={() => setDetailOpen(false)} />
          <SheetContent className="sheet-panel" innerClassName="sheet-panel__inner">
            <SheetHandle className="sheet-handle" />
            {email ? (
              <view className="detail">
                <view className="detail__header">
                  <text className="detail__subject">{subject}</text>
                  <view className="detail__actions">
                    {view !== 'all-mail' ? (
                      <IconButton active={!!email.isStar} label="*" onClick={() => toggleStar(email)} />
                    ) : null}
                    <IconButton label="TR" onClick={() => translateEmail(email)} />
                    {view !== 'all-mail' ? <IconButton label="RE" onClick={() => openComposer('reply', email)} /> : null}
                    {view !== 'all-mail' ? <IconButton label="FW" onClick={() => openComposer('forward', email)} /> : null}
                    {hasPerm(user, 'email:delete') ? (
                      <IconButton danger label="DEL" onClick={() => askDeleteEmail(email)} />
                    ) : null}
                  </view>
                </view>
                <view className="detail__sender">
                  <view className="mail-avatar">
                    <text className="mail-avatar__text">{initials(email.name || email.sendEmail)}</text>
                  </view>
                  <view className="detail__sender-text">
                    <text className="detail__from">{email.name || email.sendEmail || '-'}</text>
                    <text className="detail__muted">{email.sendEmail || '-'}</text>
                    <text className="detail__muted">{formatRecipients(email.recipient)}</text>
                    <text className="detail__muted">{formatDate(email.createTime)}</text>
                  </view>
                </view>
                {email.code ? (
                  <Button className="code-card" onClick={() => copyCode(email.code)}>
                    <text className="code-card__label">{tr(lang, 'code')}</text>
                    <text className="code-card__value">{email.code}</text>
                  </Button>
                ) : null}
                <ScrollView className="detail__body" scrollOrientation="vertical">
                  <text className="detail__text">{body || '-'}</text>
                  {email.attList?.length ? (
                    <view className="attachment-list">
                      <text className="section-title">{tr(lang, 'attachments')}</text>
                      {email.attList.map((att) => (
                        <view className="attachment-row" key={String(att.attId || att.key || att.filename)}>
                          <view className="attachment-row__body">
                            <text className="attachment-row__name">{att.filename}</text>
                            <text className="attachment-row__size">{formatBytes(att.size)}</text>
                          </view>
                          <ActionButton label={tr(lang, 'open')} onClick={() => downloadAttachment(att)} variant="soft" />
                        </view>
                      ))}
                    </view>
                  ) : null}
                </ScrollView>
              </view>
            ) : (
              <EmptyState text={tr(lang, 'noSelected')} />
            )}
          </SheetContent>
        </SheetView>
      </SheetRoot>
    )
  }

  function renderComposerSheet() {
    return (
      <SheetRoot
        show={compose.open}
        side="bottom"
        snapPoints={['94%']}
        onShowChange={(open: boolean) => !open && setCompose(emptyCompose())}
      >
        <SheetView className="sheet-view">
          <SheetBackdrop className="sheet-backdrop" onClick={() => setCompose(emptyCompose())} />
          <SheetContent className="sheet-panel" innerClassName="sheet-panel__inner">
            <SheetHandle className="sheet-handle" />
            <view className="composer">
              <view className="toolbar">
                <view className="toolbar__title">
                  <text className="page-title">{tr(lang, compose.mode === 'reply' ? 'reply' : compose.mode === 'forward' ? 'forward' : 'compose')}</text>
                  <text className="page-subtitle">{sender.sendEmail}</text>
                </view>
                <ActionButton label={tr(lang, 'cancel')} onClick={() => setCompose(emptyCompose())} variant="soft" />
              </view>
              <view className="recipient-box">
                <view className="chip-wrap">
                  {compose.receiveEmail.map((email) => (
                    <Button
                      className="recipient-chip"
                      key={email}
                      onClick={() =>
                        setCompose((current) => ({
                          ...current,
                          receiveEmail: current.receiveEmail.filter((item) => item !== email),
                        }))
                      }
                    >
                      <text className="recipient-chip__text">{email}</text>
                    </Button>
                  ))}
                </view>
                <view className="recipient-input-row">
                  <Input
                    className="recipient-input"
                    confirmType="done"
                    onConfirm={addRecipients}
                    onInput={(value: string) => setCompose((current) => ({ ...current, receiveInput: value }))}
                    placeholder={tr(lang, 'recipient')}
                    type="email"
                    value={compose.receiveInput}
                  />
                  <ActionButton label="+" onClick={() => addRecipients()} variant="soft" />
                </view>
                {recipientRecord.length ? (
                  <ScrollView className="recent-strip" scrollOrientation="horizontal">
                    <view className="recent-strip__inner">
                      {recipientRecord.slice(0, 12).map((email) => (
                        <Button className="recent-chip" key={email} onClick={() => addRecipients(email)}>
                          <text className="recent-chip__text">{email}</text>
                        </Button>
                      ))}
                    </view>
                  </ScrollView>
                ) : null}
              </view>
              <Field
                label={tr(lang, 'subject')}
                onInput={(subject) => setCompose((current) => ({ ...current, subject }))}
                value={compose.subject}
              />
              <TextField
                label={tr(lang, 'content')}
                onInput={(content) => setCompose((current) => ({ ...current, content }))}
                value={compose.content}
              />
              <view className="attachment-list">
                {compose.attachments.map((att, index) => (
                  <view className="attachment-row" key={`${att.filename}-${index}`}>
                    <view className="attachment-row__body">
                      <text className="attachment-row__name">{att.filename}</text>
                      <text className="attachment-row__size">{formatBytes(att.size)}</text>
                    </view>
                    <IconButton
                      danger
                      label="X"
                      onClick={() =>
                        setCompose((current) => ({
                          ...current,
                          attachments: current.attachments.filter((_, idx) => idx !== index),
                        }))
                      }
                    />
                  </view>
                ))}
              </view>
              <view className="composer-actions">
                <ActionButton label={tr(lang, 'addAttachment')} onClick={attachFiles} variant="soft" />
                <ActionButton label={tr(lang, 'saveDraft')} onClick={saveDraft} variant="soft" />
                <ActionButton
                  disabled={compose.sending}
                  label={compose.sending ? tr(lang, 'loading') : tr(lang, 'send')}
                  onClick={sendCompose}
                  variant="primary"
                />
              </view>
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    )
  }

  function renderDrafts() {
    return (
      <view className="page">
        <view className="toolbar">
          <view className="toolbar__title">
            <text className="page-title">{tr(lang, 'drafts')}</text>
            <text className="page-subtitle">{drafts.length}</text>
          </view>
          <ActionButton label={tr(lang, 'compose')} onClick={() => openComposer()} variant="primary" />
        </view>
        <ScrollView className="card-list" scrollOrientation="vertical">
          {drafts.length ? (
            drafts.map((draft) => (
              <view className="draft-card" key={draft.id}>
                <Button className="draft-card__body" onClick={() => openComposer('draft', undefined, draft)}>
                  <text className="draft-card__subject">{draft.subject || tr(lang, 'subject')}</text>
                  <text className="draft-card__meta">{draft.receiveEmail.join(', ') || tr(lang, 'recipient')}</text>
                  <text className="draft-card__preview">{draft.text || draft.content}</text>
                </Button>
                <IconButton
                  danger
                  label="DEL"
                  onClick={async () => {
                    const next = drafts.filter((item) => item.id !== draft.id)
                    setDrafts(next)
                    await writeStore(draftStoreKey(user.email), next).catch(() => null)
                  }}
                />
              </view>
            ))
          ) : (
            <EmptyState text={tr(lang, 'noData')} />
          )}
        </ScrollView>
      </view>
    )
  }

  function renderSettings() {
    return (
      <ScrollView className="page page-scroll" scrollOrientation="vertical">
        <view className="toolbar">
          <view className="toolbar__title">
            <text className="page-title">{tr(lang, 'settings')}</text>
            <text className="page-subtitle">{user.email || '-'}</text>
          </view>
          <ActionButton label={tr(lang, 'logout')} onClick={logout} variant="danger" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'userInfo')}</text>
          <view className="info-row"><text>{tr(lang, 'email')}</text><text>{user.email || '-'}</text></view>
          <view className="info-row"><text>{tr(lang, 'name')}</text><text>{user.name || '-'}</text></view>
          <view className="info-row"><text>{tr(lang, 'role')}</text><text>{String(user.role?.name || '-')}</text></view>
          <view className="language-row">
            <ActionButton label="简体中文" onClick={() => persistLang('zh')} variant={lang === 'zh' ? 'primary' : 'soft'} />
            <ActionButton label="English" onClick={() => persistLang('en')} variant={lang === 'en' ? 'primary' : 'soft'} />
          </view>
          <SwitchRow checked={dark} label={tr(lang, 'theme')} onChange={persistDark} />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'changePassword')}</text>
          <Field
            label={tr(lang, 'password')}
            onInput={(password) => setPasswordForm((form) => ({ ...form, password }))}
            type="password"
            value={passwordForm.password}
          />
          <Field
            label={tr(lang, 'confirmPassword')}
            onInput={(confirmValue) => setPasswordForm((form) => ({ ...form, confirm: confirmValue }))}
            type="password"
            value={passwordForm.confirm}
          />
          <ActionButton label={tr(lang, 'save')} onClick={resetPassword} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'account')}</text>
          {accounts.map((account) => (
            <view className="account-row" key={account.accountId}>
              <Button className="account-row__body" onClick={() => selectAccount(account)}>
                <text className="account-row__email">{account.email}</text>
                <text className="account-row__name">{account.name || '-'}</text>
              </Button>
              <ActionButton label={tr(lang, 'setTop')} onClick={() => request('/account/setAsTop', { method: 'PUT', body: { accountId: account.accountId } }).then(loadAccounts)} variant="soft" />
              <ActionButton label={tr(lang, 'allReceive')} onClick={() => request('/account/setAllReceive', { method: 'PUT', body: { accountId: account.accountId } }).then(loadAccounts)} variant="soft" />
              <IconButton danger label="DEL" onClick={() => deleteAccount(account)} />
            </view>
          ))}
          <Field
            label={tr(lang, 'email')}
            onInput={(email) => setAccountForm((form) => ({ ...form, email }))}
            type="email"
            value={accountForm.email}
          />
          <Field
            label={tr(lang, 'token')}
            onInput={(value) => setAccountForm((form) => ({ ...form, token: value }))}
            value={accountForm.token}
          />
          <ActionButton label={tr(lang, 'addAccount')} onClick={addAccount} variant="primary" />
        </view>
        <view className="section section--danger">
          <ActionButton label={tr(lang, 'deleteAccount')} onClick={deleteUser} variant="danger" />
        </view>
      </ScrollView>
    )
  }

  function renderManagement() {
    const columns: Record<ManagementResource, string[]> = {
      users: ['userId', 'email', 'type', 'status', 'sendCount', 'accountCount'],
      roles: ['roleId', 'name', 'description', 'isDefault', 'sendType', 'sendCount'],
      regKeys: ['regKeyId', 'code', 'roleName', 'count', 'expireTime'],
    }
    return (
      <view className="page">
        <view className="toolbar">
          <view className="toolbar__title">
            <text className="page-title">{tr(lang, managementResource)}</text>
            <text className="page-subtitle">{managementRows.length}</text>
          </view>
          <view className="toolbar__actions">
            <ActionButton label={tr(lang, 'add')} onClick={() => setManagementSheet(true)} variant="primary" />
            <IconButton label="R" onClick={loadManagement} />
          </view>
        </view>
        <view className="segmented segmented--wide">
          {(['users', 'roles', 'regKeys'] as ManagementResource[]).map((item) => (
            <ActionButton
              key={item}
              label={tr(lang, item)}
              onClick={() => setManagementResource(item)}
              variant={managementResource === item ? 'primary' : 'soft'}
            />
          ))}
        </view>
        <view className="search-row">
          <Input
            className="search-input"
            confirmType="search"
            onConfirm={loadManagement}
            onInput={(value: string) => setManagementSearch(value)}
            placeholder={tr(lang, 'search')}
            value={managementSearch}
          />
          <ActionButton label={tr(lang, 'search')} onClick={loadManagement} variant="soft" />
        </view>
        <ScrollView className="card-list" scrollOrientation="vertical">
          {managementLoading ? (
            <EmptyState text={tr(lang, 'loading')} />
          ) : managementRows.length ? (
            managementRows.map((row, index) => (
              <view className="data-card" key={`${managementResource}-${index}`}>
                {columns[managementResource].map((column) => (
                  <view className="data-row" key={column}>
                    <text className="data-row__label">{column}</text>
                    <text className="data-row__value">{compact(row[column])}</text>
                  </view>
                ))}
                <view className="data-card__actions">
                  {managementResource === 'users' ? (
                    <ActionButton label={tr(lang, 'resetSend')} onClick={() => request('/user/resetSendCount', { method: 'PUT', body: { userId: row.userId } }).then(loadManagement)} variant="soft" />
                  ) : null}
                  {managementResource === 'roles' ? (
                    <ActionButton label={tr(lang, 'setTop')} onClick={() => request('/role/setDefault', { method: 'PUT', body: { roleId: row.roleId } }).then(loadManagement)} variant="soft" />
                  ) : null}
                  {managementResource === 'regKeys' ? (
                    <ActionButton label={tr(lang, 'copyInvite')} onClick={() => copyInvite(row)} variant="soft" />
                  ) : null}
                  <ActionButton label={tr(lang, 'delete')} onClick={() => deleteManagementRow(row)} variant="danger" />
                </view>
              </view>
            ))
          ) : (
            <EmptyState text={tr(lang, 'noData')} />
          )}
        </ScrollView>
      </view>
    )
  }

  function renderManagementSheet() {
    return (
      <SheetRoot show={managementSheet} side="bottom" snapPoints={['80%']} onShowChange={setManagementSheet}>
        <SheetView className="sheet-view">
          <SheetBackdrop className="sheet-backdrop" onClick={() => setManagementSheet(false)} />
          <SheetContent className="sheet-panel" innerClassName="sheet-panel__inner">
            <SheetHandle className="sheet-handle" />
            <ScrollView className="page-scroll" scrollOrientation="vertical">
              <text className="page-title">{tr(lang, 'add')} {tr(lang, managementResource)}</text>
              {managementResource === 'users' ? (
                <view className="form-stack">
                  <Field label={tr(lang, 'email')} onInput={(email) => setManagementForm((form) => ({ ...form, email }))} type="email" value={managementForm.email} />
                  <Field label={tr(lang, 'password')} onInput={(password) => setManagementForm((form) => ({ ...form, password }))} type="password" value={managementForm.password} />
                  <Field label="roleId" onInput={(roleId) => setManagementForm((form) => ({ ...form, roleId }))} type="number" value={managementForm.roleId} />
                </view>
              ) : null}
              {managementResource === 'roles' ? (
                <view className="form-stack">
                  <Field label={tr(lang, 'name')} onInput={(roleName) => setManagementForm((form) => ({ ...form, roleName }))} value={managementForm.roleName} />
                  <Field label="description" onInput={(description) => setManagementForm((form) => ({ ...form, description }))} value={managementForm.description} />
                </view>
              ) : null}
              {managementResource === 'regKeys' ? (
                <view className="form-stack">
                  <Field label={tr(lang, 'inviteCode')} onInput={(code) => setManagementForm((form) => ({ ...form, code }))} value={managementForm.code} />
                  <Field label="roleId" onInput={(roleId) => setManagementForm((form) => ({ ...form, roleId }))} type="number" value={managementForm.roleId} />
                  <Field label="count" onInput={(count) => setManagementForm((form) => ({ ...form, count }))} type="number" value={managementForm.count} />
                  <Field label="expireTime" onInput={(expireTime) => setManagementForm((form) => ({ ...form, expireTime }))} value={managementForm.expireTime} />
                </view>
              ) : null}
              {roleOptions.length ? (
                <ScrollView className="filter-strip" scrollOrientation="horizontal">
                  <view className="filter-strip__inner">
                    {roleOptions.map((role) => (
                      <ActionButton
                        key={String(role.roleId)}
                        label={String(role.name || role.roleId)}
                        onClick={() => setManagementForm((form) => ({ ...form, roleId: String(role.roleId || '') }))}
                        variant={managementForm.roleId === String(role.roleId || '') ? 'primary' : 'soft'}
                      />
                    ))}
                  </view>
                </ScrollView>
              ) : null}
              <view className="composer-actions">
                <ActionButton label={tr(lang, 'cancel')} onClick={() => setManagementSheet(false)} variant="soft" />
                <ActionButton label={tr(lang, 'save')} onClick={addManagementRow} variant="primary" />
              </view>
            </ScrollView>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    )
  }

  function renderAnalysis() {
    const numberCount = (analysis?.numberCount || {}) as Record<string, unknown>
    const receiveRatio = (analysis?.receiveRatio || {}) as Record<string, unknown>
    const sources = asList<Record<string, unknown>>(receiveRatio.nameRatio).slice(0, 8)
    const receiveDays = asList<Record<string, unknown>>(
      ((analysis?.emailDayCount || {}) as Record<string, unknown>).receiveDayCount,
    ).slice(-10)
    return (
      <ScrollView className="page page-scroll" scrollOrientation="vertical">
        <view className="toolbar">
          <view className="toolbar__title">
            <text className="page-title">{tr(lang, 'analytics')}</text>
            <text className="page-subtitle">{analysisLoading ? tr(lang, 'loading') : 'Cloud Mail'}</text>
          </view>
          <IconButton label="R" onClick={loadAnalysis} />
        </view>
        <view className="stat-grid">
          <StatCard label={tr(lang, 'totalReceived')} value={numberCount.receiveTotal} />
          <StatCard label={tr(lang, 'totalSent')} tone="green" value={numberCount.sendTotal} />
          <StatCard label={tr(lang, 'totalMailboxes')} tone="amber" value={numberCount.accountTotal} />
          <StatCard label={tr(lang, 'totalUsers')} tone="red" value={numberCount.userTotal} />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'sentToday')}: {Number(analysis?.daySendTotal || 0).toLocaleString()}</text>
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'sourceRatio')}</text>
          {sources.map((item, index) => (
            <view className="bar-row" key={`${item.name}-${index}`}>
              <text className="bar-row__label">{String(item.name || '-')}</text>
              <view className="bar-row__track">
                <view className="bar-row__fill" style={{ width: `${Math.min(100, Number(item.total || 0))}%` }} />
              </view>
              <text className="bar-row__value">{String(item.total || 0)}</text>
            </view>
          ))}
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'recentGrowth')}</text>
          <view className="mini-chart">
            {receiveDays.map((item, index) => (
              <view className="mini-chart__bar" key={`${item.date}-${index}`} style={{ height: `${Math.max(8, Number(item.total || 0) * 4)}px` }}>
                <text className="mini-chart__label">{String(item.total || 0)}</text>
              </view>
            ))}
          </view>
        </view>
      </ScrollView>
    )
  }

  function renderSystem() {
    return (
      <ScrollView className="page page-scroll" scrollOrientation="vertical">
        <view className="toolbar">
          <view className="toolbar__title">
            <text className="page-title">{tr(lang, 'system')}</text>
            <text className="page-subtitle">{systemLoading ? tr(lang, 'loading') : 'Cloud Mail'}</text>
          </view>
          <IconButton label="R" onClick={loadSystemSettings} />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'site')}</text>
          <SwitchRow checked={Number(systemForm.register ?? 1) === 0} label={tr(lang, 'register')} onChange={(checked) => setSystemForm((form) => ({ ...form, register: checked ? 0 : 1 }))} />
          <SwitchRow checked={Number(systemForm.regKey ?? 1) === 0} label={tr(lang, 'inviteCode')} onChange={(checked) => setSystemForm((form) => ({ ...form, regKey: checked ? 0 : 1 }))} />
          <Field label="minEmailPrefix" onInput={(value) => setSystemForm((form) => ({ ...form, minEmailPrefix: Number(value || 0) }))} type="number" value={String(systemForm.minEmailPrefix ?? 1)} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['register', 'regKey', 'minEmailPrefix'])} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'appearance')}</text>
          <Field label={tr(lang, 'title')} onInput={(title) => setSystemForm((form) => ({ ...form, title }))} value={String(systemForm.title || '')} />
          <Field label="loginOpacity" onInput={(value) => setSystemForm((form) => ({ ...form, loginOpacity: Number(value || 1) }))} type="number" value={String(systemForm.loginOpacity ?? 1)} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['title', 'loginOpacity'])} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'mail')}</text>
          <SwitchRow checked={Number(systemForm.receive ?? 1) === 0} label={tr(lang, 'totalReceived')} onChange={(checked) => setSystemForm((form) => ({ ...form, receive: checked ? 0 : 1 }))} />
          <SwitchRow checked={Number(systemForm.send ?? 1) === 0} label={tr(lang, 'totalSent')} onChange={(checked) => setSystemForm((form) => ({ ...form, send: checked ? 0 : 1 }))} />
          <Field label={tr(lang, 'autoRefresh')} onInput={(value) => setSystemForm((form) => ({ ...form, autoRefresh: Number(value || 0) }))} type="number" value={String(systemForm.autoRefresh ?? 0)} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['receive', 'send', 'autoRefresh'])} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'storage')}</text>
          <Field label={tr(lang, 'r2Domain')} onInput={(r2Domain) => setSystemForm((form) => ({ ...form, r2Domain }))} value={String(systemForm.r2Domain || '')} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['r2Domain'])} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'verification')}</text>
          <Field label="regVerifyCount" onInput={(value) => setSystemForm((form) => ({ ...form, regVerifyCount: Number(value || 1) }))} type="number" value={String(systemForm.regVerifyCount ?? 1)} />
          <Field label="addVerifyCount" onInput={(value) => setSystemForm((form) => ({ ...form, addVerifyCount: Number(value || 1) }))} type="number" value={String(systemForm.addVerifyCount ?? 1)} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['regVerifyCount', 'addVerifyCount'])} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'notice')}</text>
          <SwitchRow checked={Number(systemForm.notice ?? 1) === 0} label={tr(lang, 'enabled')} onChange={(checked) => setSystemForm((form) => ({ ...form, notice: checked ? 0 : 1 }))} />
          <Field label="noticeTitle" onInput={(noticeTitle) => setSystemForm((form) => ({ ...form, noticeTitle }))} value={String(systemForm.noticeTitle || '')} />
          <TextField label="noticeContent" onInput={(noticeContent) => setSystemForm((form) => ({ ...form, noticeContent }))} value={String(systemForm.noticeContent || '')} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['notice', 'noticeTitle', 'noticeContent'])} variant="primary" />
        </view>
        <view className="section">
          <text className="section-title">{tr(lang, 'ai')}</text>
          <CheckRow checked={Number(systemForm.aiCode ?? 1) === 0} label="AI Code" onChange={(checked) => setSystemForm((form) => ({ ...form, aiCode: checked ? 0 : 1 }))} />
          <ActionButton label={tr(lang, 'save')} onClick={() => saveSystemPatch(['aiCode'])} variant="primary" />
        </view>
      </ScrollView>
    )
  }
}
