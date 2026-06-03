import { AlertDialog, Button, ButtonGroup, Tabs } from '@heroui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resetPassword, userDelete } from '@/api/my';
import { notifyError, notifySuccess } from '@/lib/notify';
import AccountSwitcher from '@/components/AccountSwitcher';
import ConfirmButton from '@/components/ConfirmButton';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { useAppStore } from '@/store/app-store';

export default function SettingsPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const lang = useAppStore((state) => state.lang);
  const setLang = useAppStore((state) => state.setLang);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  function resetPasswordForm() {
    setPassword('');
    setConfirmPassword('');
  }

  async function savePassword(close: () => void) {
    if (!password || password.length < 6) return notifyError(t('pwdLengthMsg'));
    if (password !== confirmPassword) return notifyError(t('confirmPwdFailMsg'));
    setSavingPassword(true);
    try {
      await resetPassword(password);
      resetPasswordForm();
      close();
      notifySuccess(t('saveSuccessMsg'));
    } finally {
      setSavingPassword(false);
    }
  }

  async function removeUser() {
    await userDelete();
    localStorage.removeItem('token');
    location.href = '/login';
  }

  const rows = [
    [t('emailAccount'), user.email],
    [t('username'), user.name],
    [t('role'), user.role?.name],
  ];

  return (
    <WorkspaceLayout title={t('settings')}>
      <Tabs className="settings-tabs w-full" defaultSelectedKey="details">
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('settings')}>
            <Tabs.Tab id="details">
              {t('details')}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="mail-management">
              {t('mailManagement')}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-5" id="details">
          <div className="max-w-4xl space-y-5">
            <section className="surface-card overflow-hidden rounded-[24px]">
              <div className="border-b border-separator px-6 py-4">
                <h2 className="text-lg font-semibold">{t('details')}</h2>
              </div>

              <div className="divide-y divide-separator">
                {rows.map(([label, value]) => (
                  <div className="grid gap-3 px-6 py-4 sm:grid-cols-[180px_1fr]" key={label}>
                    <div className="text-sm font-medium text-muted">{label}</div>
                    <div className="min-w-0 truncate text-sm font-semibold">{value || '-'}</div>
                  </div>
                ))}

                <div className="grid gap-3 px-6 py-4 sm:grid-cols-[180px_1fr]">
                  <div className="text-sm font-medium text-muted">{t('language')}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ButtonGroup>
                      <Button variant={lang === 'zh' ? 'primary' : 'outline'} onPress={() => setLang('zh')}>
                        简体中文
                      </Button>
                      <Button variant={lang === 'en' ? 'primary' : 'outline'} onPress={() => setLang('en')}>
                        English
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>

                <div className="grid gap-3 px-6 py-4 sm:grid-cols-[180px_1fr]">
                  <div>
                    <div className="text-sm font-medium text-muted">{t('password')}</div>
                    <div className="mt-1 text-xs text-muted">{t('changePasswordHint')}</div>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <AlertDialog>
                      <Button variant="outline" onPress={resetPasswordForm}>
                        {t('changePassword')}
                      </Button>
                      <AlertDialog.Backdrop>
                        <AlertDialog.Container>
                          <AlertDialog.Dialog className="sm:max-w-[460px]">
                            {({ close }: any) => (
                              <>
                                <AlertDialog.Header>
                                  <AlertDialog.Icon status="accent" />
                                  <AlertDialog.Heading>{t('changePassword')}</AlertDialog.Heading>
                                </AlertDialog.Header>
                                <AlertDialog.Body>
                                  <div className="space-y-4">
                                    <p className="text-sm text-muted">{t('changePasswordDescription')}</p>
                                    <label className="block space-y-2">
                                      <span className="text-sm font-medium text-muted">{t('newPassword')}</span>
                                      <input
                                        autoComplete="new-password"
                                        className="w-full rounded-xl border border-border bg-field px-3 py-2 outline-none"
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder={t('newPassword')}
                                        type="password"
                                        value={password}
                                      />
                                    </label>
                                    <label className="block space-y-2">
                                      <span className="text-sm font-medium text-muted">{t('confirmPassword')}</span>
                                      <input
                                        autoComplete="new-password"
                                        className="w-full rounded-xl border border-border bg-field px-3 py-2 outline-none"
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') savePassword(close);
                                        }}
                                        placeholder={t('confirmPassword')}
                                        type="password"
                                        value={confirmPassword}
                                      />
                                    </label>
                                  </div>
                                </AlertDialog.Body>
                                <AlertDialog.Footer>
                                  <Button
                                    isDisabled={savingPassword}
                                    onPress={() => {
                                      resetPasswordForm();
                                      close();
                                    }}
                                    variant="outline"
                                  >
                                    {t('cancel')}
                                  </Button>
                                  <Button isDisabled={savingPassword} onPress={() => savePassword(close)}>
                                    {t('save')}
                                  </Button>
                                </AlertDialog.Footer>
                              </>
                            )}
                          </AlertDialog.Dialog>
                        </AlertDialog.Container>
                      </AlertDialog.Backdrop>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </section>

            <section className="surface-card overflow-hidden rounded-[24px]">
              <div className="grid gap-3 px-6 py-5 sm:grid-cols-[180px_1fr]">
                <div>
                  <div className="text-sm font-medium text-muted">{t('delete')}</div>
                  <div className="mt-1 text-xs text-muted">{t('deleteAccountHint')}</div>
                </div>
                <div className="flex justify-start sm:justify-end">
                  <ConfirmButton
                    description={t('deleteAccountConfirmDescription')}
                    onConfirm={removeUser}
                    title={t('deleteAccountConfirmTitle')}
                  >
                    {t('delete')}
                  </ConfirmButton>
                </div>
              </div>
            </section>
          </div>
        </Tabs.Panel>

        <Tabs.Panel className="pt-5" id="mail-management">
          <section className="surface-card max-w-3xl rounded-2xl p-5">
            <AccountSwitcher variant="panel" />
          </section>
        </Tabs.Panel>
      </Tabs>
    </WorkspaceLayout>
  );
}
