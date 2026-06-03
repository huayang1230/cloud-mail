import { Avatar, Button, Spinner } from '@heroui/react';
import { Mail, Moon, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, register } from '@/api/login';
import { loginUserInfo } from '@/api/my';
import { oauthBindUser, oauthLinuxDoLogin } from '@/api/oauth';
import { HeroSelectField } from '@/components/HeroFormControls';
import { cvtR2Url, isEmail } from '@/lib/utils';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/notify';
import { useAppStore } from '@/store/app-store';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const settings = useAppStore((state) => state.settings);
  const domainList = useAppStore((state) => state.domainList);
  const dark = useAppStore((state) => state.dark);
  const setDark = useAppStore((state) => state.setDark);
  const setUser = useAppStore((state) => state.setUser);
  const setCurrentAccount = useAppStore((state) => state.setCurrentAccount);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [suffix, setSuffix] = useState(domainList[0] || '');
  const [loading, setLoading] = useState(false);
  const [bindOauthUserId, setBindOauthUserId] = useState('');

  useEffect(() => {
    if (!suffix && domainList.length) setSuffix(domainList[0]);
  }, [domainList, suffix]);

  useEffect(() => {
    const inviteCode = searchParams.get('inviteCode') || searchParams.get('regKey');
    if (!inviteCode) return;
    setMode('register');
    setCode(inviteCode);
  }, [searchParams]);

  useEffect(() => {
    const oauthCode = searchParams.get('code');
    if (!oauthCode) return;
    setLoading(true);
    oauthLinuxDoLogin(oauthCode)
      .then(async (data: any) => {
        if (!data.token) {
          setBindOauthUserId(data.userInfo?.oauthUserId || '');
          notifyWarning('请注册绑定一个邮箱');
          return;
        }
        await saveToken(data.token);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const fullEmail = useMemo(() => {
    if (settings.loginDomain === 1 || email.includes('@')) return email;
    return `${email}${suffix || ''}`;
  }, [email, settings.loginDomain, suffix]);

  const backgroundStyle = useMemo(() => {
    if (!settings.background) {
      return {
        backgroundImage: dark
          ? 'radial-gradient(circle at 18% 18%, rgb(45 212 191 / 0.18), transparent 30%), radial-gradient(circle at 78% 12%, rgb(96 165 250 / 0.18), transparent 34%), radial-gradient(circle at 58% 88%, rgb(168 85 247 / 0.14), transparent 36%), linear-gradient(135deg, #111827 0%, #18181b 52%, #0f172a 100%)'
          : 'radial-gradient(circle at 18% 18%, rgb(125 211 252 / 0.42), transparent 30%), radial-gradient(circle at 82% 12%, rgb(167 139 250 / 0.34), transparent 34%), radial-gradient(circle at 64% 86%, rgb(45 212 191 / 0.24), transparent 36%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 48%, #f5f3ff 100%)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        height: '100dvh',
        minHeight: '100dvh',
      };
    }
    const opacity = Number(settings.loginDarkenFactor ?? 0);
    const url = cvtR2Url(settings.background);
    return {
      backgroundImage: `linear-gradient(rgb(0 0 0 / ${opacity}), rgb(0 0 0 / ${opacity})), url(${url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: '100dvh',
      minHeight: '100dvh',
    };
  }, [dark, settings.background, settings.loginDarkenFactor]);

  async function saveToken(token: string) {
    localStorage.setItem('token', token);
    const user: any = await loginUserInfo();
    setUser(user);
    setCurrentAccount(user.account || null);
    notifySuccess(t('loginBtn'));
    navigate('/inbox', { replace: true });
  }

  async function submit() {
    if (!fullEmail) return notifyError(t('emptyEmailMsg'));
    if (!password) return notifyError(t('emptyPwdMsg'));
    setLoading(true);
    try {
      const data: any = await login(fullEmail, password);
      await saveToken(data.token);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    if (!fullEmail || !isEmail(fullEmail)) return notifyError(t('notEmailMsg'));
    if (!password) return notifyError(t('emptyPwdMsg'));
    if (password.length < 6) return notifyError(t('pwdLengthMsg'));
    if (password !== confirmPassword) return notifyError(t('confirmPwdFailMsg'));
    setLoading(true);
    try {
      const form = { email: fullEmail, password, code };
      const data: any = bindOauthUserId
        ? await oauthBindUser({ email: fullEmail, oauthUserId: bindOauthUserId, code })
        : await register(form);
      notifySuccess(t('regBtn'));
      if (data?.token) await saveToken(data.token);
      else setMode('login');
    } finally {
      setLoading(false);
    }
  }

  function linuxDoLogin() {
    const clientId = settings.linuxdoClientId;
    const redirectUri = encodeURIComponent(settings.linuxdoCallbackUrl || window.location.href);
    window.location.href = `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email`;
  }

  return (
    <main className="flex min-h-screen items-start justify-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-6 pt-16 sm:items-center sm:p-6" style={backgroundStyle}>
      <button className="icon-button fixed right-4 top-4 sm:right-5 sm:top-5" onClick={() => setDark(!dark)} type="button">
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
      <div
        className="surface-card w-full max-w-[430px] rounded-[28px] p-5 sm:p-8"
        style={{ background: dark ? `rgb(0 0 0 / ${settings.loginOpacity ?? 0.88})` : `rgb(255 255 255 / ${settings.loginOpacity ?? 0.94})` }}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Avatar className="size-16 bg-gradient-to-br from-sky-200 via-emerald-200 to-violet-400">
            <Avatar.Fallback>
              <Mail className="size-7" />
            </Avatar.Fallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{settings.title || 'Cloud Mail'}</h1>
            <p className="mt-1 text-sm text-muted">{mode === 'login' ? t('loginTitle') : t('regTitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex min-w-0 overflow-hidden rounded-2xl border border-border bg-field">
            <input
              className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('emailAccount')}
              value={email}
            />
            {settings.loginDomain !== 1 && !email.includes('@') ? (
              <HeroSelectField
                className="w-[136px] max-w-[48%] shrink-0 sm:w-[150px]"
                onChange={setSuffix}
                options={domainList.map((domain) => ({ label: domain, value: domain }))}
                placeholder="@"
                triggerClassName="inline-domain-select-trigger h-full min-w-0 rounded-none border-0 bg-transparent px-2 text-sm shadow-none"
                value={suffix}
              />
            ) : null}
          </div>
          <input
            className="w-full rounded-2xl border border-border bg-field px-4 py-3 outline-none"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && mode === 'login') submit();
            }}
            placeholder={t('password')}
            type="password"
            value={password}
          />
          {mode === 'register' ? (
            <>
              <input
                className="w-full rounded-2xl border border-border bg-field px-4 py-3 outline-none"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t('confirmPassword')}
                type="password"
                value={confirmPassword}
              />
              {settings.regKey === 0 || settings.regKey === 2 ? (
                <input
                  className="w-full rounded-2xl border border-border bg-field px-4 py-3 outline-none"
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={settings.regKey === 2 ? t('regKeyOptional') : t('regKey')}
                  value={code}
                />
              ) : null}
            </>
          ) : null}
          <Button className="w-full" isPending={loading} onPress={mode === 'login' ? submit : submitRegister}>
            {loading ? <Spinner color="current" size="sm" /> : null}
            {mode === 'login' ? t('loginBtn') : t('regBtn')}
          </Button>
          {settings.linuxdoSwitch ? (
            <Button className="w-full" variant="outline" onPress={linuxDoLogin}>
              <img alt="" className="size-5" src="/image/linuxdo.webp" />
              LinuxDo
            </Button>
          ) : null}
        </div>

        {settings.register === 0 ? (
          <button
            className="mt-6 w-full text-center text-sm text-muted"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            type="button"
          >
            {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
            <span className="font-semibold text-accent">{mode === 'login' ? t('regSwitch') : t('loginSwitch')}</span>
          </button>
        ) : null}
      </div>
    </main>
  );
}
