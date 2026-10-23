import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBlocker, useNavigate } from 'react-router-dom';
import { KeyRound, Save, UserRound } from 'lucide-react';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import { getCurrentUser, updateAccount } from '../../api/authApi';
import { useTheme, DEFAULT_DARK_COLOR } from '../../context/ThemeContext';

function PrivacySwitch({ checked, onChange, label, disabled }) {
  return <label className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3"><span className="text-sm font-medium">{label}</span><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" /><span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-white/80 bg-slate-300/80 shadow-inner transition duration-300 after:absolute after:left-1 after:top-1/2 after:h-5 after:w-5 after:-translate-y-1/2 after:rounded-full after:bg-white after:shadow-md after:transition-transform after:duration-300 peer-checked:bg-[#237596] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#237596] peer-focus-visible:ring-offset-2 peer-disabled:opacity-50" /></label>;
}

function errorMessage(error) {
  const data = error.response?.data;
  if (data?.fields) return Object.values(data.fields)[0];
  return typeof data === 'string' ? data : data?.error || 'Không thể cập nhật tài khoản. Vui lòng thử lại.';
}

export default function AccountSettingsPage() {
  const { theme, setTheme, darkColor, setDarkColor } = useTheme();
  const [form, setForm] = useState({ fullName: '', phone: '', messengerUrl: '', zaloUrl: '', showPhone: false, showMessenger: false, showZalo: false, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const navigate = useNavigate();
  const snapshot = JSON.stringify({ form, theme, darkColor });
  const dirty = savedSnapshot !== null && snapshot !== savedSnapshot;
  const blocker = useBlocker(dirty && !saving);

  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.email);
      if (data.themePreference) setTheme(data.themePreference);
      if (data.darkColor) setDarkColor(data.darkColor);
      const loadedForm = { fullName: data.fullName || '', phone: data.phone || '', messengerUrl: data.messengerUrl || '', zaloUrl: data.zaloUrl || '', showPhone: Boolean(data.showPhone), showMessenger: Boolean(data.showMessenger), showZalo: Boolean(data.showZalo), currentPassword: '', newPassword: '', confirmPassword: '' };
      setForm((current) => ({ ...current, ...loadedForm }));
      setSavedSnapshot(JSON.stringify({ form: loadedForm, theme: data.themePreference || theme, darkColor: data.darkColor || DEFAULT_DARK_COLOR }));
    }).catch(() => {
      if (active) setMessage('Không thể tải thông tin tài khoản.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);
    if (!form.fullName.trim()) { setMessage('Tên người dùng không được để trống.'); return; }
    if (form.newPassword && form.newPassword.length < 4) { setMessage('Mật khẩu mới phải có ít nhất 4 ký tự.'); return; }
    if (form.newPassword && !form.currentPassword) { setMessage('Hãy nhập mật khẩu hiện tại để đổi mật khẩu.'); return; }
    if (form.newPassword !== form.confirmPassword) { setMessage('Xác nhận mật khẩu mới không khớp.'); return; }

    try {
      setSaving(true);
      const { data } = await updateAccount({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        messengerUrl: form.messengerUrl.trim() || null,
        zaloUrl: form.zaloUrl.trim() || null,
        showPhone: form.showPhone,
        showMessenger: form.showMessenger,
        showZalo: form.showZalo,
        themePreference: theme,
        darkColor,
        currentPassword: form.newPassword ? form.currentPassword : null,
        newPassword: form.newPassword || null,
      });
      setForm((current) => ({ ...current, fullName: data.fullName, phone: data.phone || '', messengerUrl: data.messengerUrl || '', zaloUrl: data.zaloUrl || '', showPhone: Boolean(data.showPhone), showMessenger: Boolean(data.showMessenger), showZalo: Boolean(data.showZalo), currentPassword: '', newPassword: '', confirmPassword: '' }));
      const savedForm = { fullName: data.fullName, phone: data.phone || '', messengerUrl: data.messengerUrl || '', zaloUrl: data.zaloUrl || '', showPhone: Boolean(data.showPhone), showMessenger: Boolean(data.showMessenger), showZalo: Boolean(data.showZalo), currentPassword: '', newPassword: '', confirmPassword: '' };
      setSavedSnapshot(JSON.stringify({ form: savedForm, theme: data.themePreference || theme, darkColor: data.darkColor || darkColor }));
      sessionStorage.setItem('thefinder-user-name', data.fullName);
      window.dispatchEvent(new CustomEvent('thefinder:account-updated', { detail: data }));
      setSuccess(true);
      setMessage('Đã cập nhật tài khoản thành công.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (blocker.state === 'blocked') setConfirmLeave(true);
  }, [blocker.state]);

  function leaveSettings() {
    setConfirmLeave(false);
    if (blocker.state === 'blocked') blocker.proceed();
    else navigate(-1);
  }

  return <div className="mobile-sidebar-page authenticated-page min-h-screen bg-white">
    <AuthenticatedNavigation />
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] pb-16 pt-5 sm:w-[calc(100%-3rem)]">
      <header>
        <p className="font-semibold text-[#237596]">Tài khoản</p>
        <h1 className="mt-1 text-3xl font-bold text-[#14252c] sm:text-4xl">Cài đặt tài khoản</h1>
        <p className="mt-2 text-slate-600">Cập nhật thông tin cá nhân hoặc đổi mật khẩu đăng nhập.</p>
      </header>

      <form onSubmit={submit} className="mt-7 space-y-6">
        <section className="rounded-[18px] border border-[#9fc5d4] bg-white p-5 sm:p-7" aria-labelledby="appearance-title">
          <h2 id="appearance-title" className="text-xl font-semibold">Giao diện</h2>
          <p className="mt-2 text-sm text-slate-500">Chọn giao diện cho toàn bộ trang web.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={`rounded-[18px] border p-4 text-left transition ${theme === 'light' ? 'border-[#237596] ring-2 ring-[#237596]/20' : 'border-slate-200'}`}><span className="block font-semibold">Sáng</span><span className="mt-1 block text-sm text-slate-500">Giao diện sáng mặc định</span></button>
            <button type="button" onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={`rounded-[18px] border p-4 text-left transition ${theme === 'dark' ? 'border-[#237596] ring-2 ring-[#237596]/20' : 'border-slate-200'}`}><span className="block font-semibold">Tối</span><span className="mt-1 block text-sm text-slate-500">Tùy chỉnh màu nền tối</span></button>
          </div>
          <label className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">Màu nền dark mode
            <input type="color" value={darkColor} onChange={(event) => setDarkColor(event.target.value)} aria-label="Chọn màu nền dark mode" className="h-10 w-14 cursor-pointer rounded-[18px] border border-slate-300 bg-transparent p-1" />
            <input type="text" value={darkColor} onChange={(event) => /^#[0-9a-fA-F]{6}$/.test(event.target.value) && setDarkColor(event.target.value)} aria-label="Mã màu nền dark mode" pattern="#[0-9a-fA-F]{6}" maxLength={7} className="h-10 w-28 rounded-[18px] border border-slate-300 px-3 font-mono uppercase outline-none focus:border-[#237596]" />
            <button type="button" onClick={() => setDarkColor(DEFAULT_DARK_COLOR)} className="text-[#237596] underline underline-offset-2">Đặt lại</button>
          </label>
          <p className="mt-2 text-xs text-slate-500">Mã màu hex 6 ký tự, ví dụ #000000. Lựa chọn được lưu cùng tài khoản.</p>
        </section>

        <section className="rounded-[18px] border border-[#9fc5d4] bg-white p-5 sm:p-7" aria-labelledby="personal-info-title">
          <h2 id="personal-info-title" className="flex items-center gap-2 text-xl font-semibold"><UserRound className="text-[#237596]" />Thông tin cá nhân</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Tên người dùng<input name="fullName" value={form.fullName} onChange={change} disabled={loading || saving} maxLength={255} required className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium">Số điện thoại<input name="phone" type="tel" value={form.phone} onChange={change} disabled={loading || saving} maxLength={20} placeholder="Không bắt buộc" className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium">URL Messenger<input name="messengerUrl" type="url" value={form.messengerUrl} onChange={change} disabled={loading || saving} maxLength={500} placeholder="https://m.me/ten-cua-ban" className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium">URL Zalo<input name="zaloUrl" type="url" value={form.zaloUrl} onChange={change} disabled={loading || saving} maxLength={500} placeholder="https://zalo.me/..." className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium sm:col-span-2">Email<input value={email} disabled className="mt-2 h-11 w-full rounded-[18px] border border-slate-200 bg-slate-100 px-4 text-slate-500" /><span className="mt-1 block text-xs font-normal text-slate-500">Email đăng nhập hiện chưa hỗ trợ thay đổi.</span></label>
          </div>
          <div className="mt-6"><h3 className="font-semibold">Thông tin hiển thị khi người khác liên hệ</h3><p className="mt-1 text-xs text-slate-500">Chỉ những mục được bật mới xuất hiện trên hồ sơ và danh sách liên hệ.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><PrivacySwitch label="Số điện thoại" checked={form.showPhone} disabled={!form.phone || loading || saving} onChange={(event) => setForm((current) => ({ ...current, showPhone: event.target.checked }))} /><PrivacySwitch label="Messenger" checked={form.showMessenger} disabled={!form.messengerUrl || loading || saving} onChange={(event) => setForm((current) => ({ ...current, showMessenger: event.target.checked }))} /><PrivacySwitch label="Zalo" checked={form.showZalo} disabled={!form.zaloUrl || loading || saving} onChange={(event) => setForm((current) => ({ ...current, showZalo: event.target.checked }))} /></div></div>
        </section>

        <section className="rounded-[18px] border border-[#9fc5d4] bg-white p-5 sm:p-7" aria-labelledby="password-title">
          <h2 id="password-title" className="flex items-center gap-2 text-xl font-semibold"><KeyRound className="text-[#237596]" />Đổi mật khẩu</h2>
          <p className="mt-2 text-sm text-slate-500">Để trống cả ba ô nếu bạn chỉ muốn sửa thông tin cá nhân.</p>
          <div className="mt-5 grid gap-4">
            <label className="block text-sm font-medium">Mật khẩu hiện tại<input name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={change} disabled={loading || saving} className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Mật khẩu mới<input name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={change} disabled={loading || saving} maxLength={72} className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
              <label className="block text-sm font-medium">Nhập lại mật khẩu mới<input name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={change} disabled={loading || saving} maxLength={72} className="mt-2 h-11 w-full rounded-[18px] border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
            </div>
          </div>
        </section>

        {message && <p role="status" className={`rounded-[18px] border p-4 text-sm ${success ? 'border-[#237596] bg-[#eef8fc] text-[#237596]' : 'border-red-200 bg-red-50 text-red-700'}`}>{message}</p>}
        <button type="submit" disabled={loading || saving} className="ml-auto flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#237596] px-7 font-semibold text-white disabled:opacity-50 sm:w-auto"><Save className="h-5 w-5" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>
    </main>
    {confirmLeave && createPortal(<div className="fixed inset-0 z-[110] grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-[18px] border border-[#237596] bg-white p-6 text-center shadow-2xl"><h2 className="text-2xl font-semibold">Lưu cài đặt?</h2><p className="mt-3 text-slate-600">Bạn có thay đổi chưa lưu. Bạn muốn lưu trước khi thoát không?</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => { setConfirmLeave(false); blocker.reset(); }} className="h-11 rounded-full border border-[#237596]">Ở lại</button><button type="button" onClick={leaveSettings} className="h-11 rounded-full bg-[#fb5353] text-white">Thoát</button><button type="button" onClick={async () => { await document.querySelector('form')?.requestSubmit(); }} className="h-11 rounded-full bg-[#237596] text-white">Lưu</button></div></section></div>, document.body)}
  </div>;
}
