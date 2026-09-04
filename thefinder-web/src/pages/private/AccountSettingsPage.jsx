import { useEffect, useState } from 'react';
import { KeyRound, Save, UserRound } from 'lucide-react';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import { getCurrentUser, updateAccount } from '../../api/authApi';

function PrivacySwitch({ checked, onChange, label, disabled }) {
  return <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"><span className="text-sm font-medium">{label}</span><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" /><span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-white/80 bg-slate-300/80 shadow-inner transition duration-300 after:absolute after:left-1 after:top-1/2 after:h-5 after:w-5 after:-translate-y-1/2 after:rounded-full after:bg-white after:shadow-md after:transition-transform after:duration-300 peer-checked:bg-[#237596] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#237596] peer-focus-visible:ring-offset-2 peer-disabled:opacity-50" /></label>;
}

function errorMessage(error) {
  const data = error.response?.data;
  if (data?.fields) return Object.values(data.fields)[0];
  return typeof data === 'string' ? data : data?.error || 'Không thể cập nhật tài khoản. Vui lòng thử lại.';
}

export default function AccountSettingsPage() {
  const [form, setForm] = useState({ fullName: '', phone: '', messengerUrl: '', zaloUrl: '', showPhone: false, showMessenger: false, showZalo: false, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.email);
      setForm((current) => ({ ...current, fullName: data.fullName || '', phone: data.phone || '', messengerUrl: data.messengerUrl || '', zaloUrl: data.zaloUrl || '', showPhone: Boolean(data.showPhone), showMessenger: Boolean(data.showMessenger), showZalo: Boolean(data.showZalo) }));
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
        currentPassword: form.newPassword ? form.currentPassword : null,
        newPassword: form.newPassword || null,
      });
      setForm((current) => ({ ...current, fullName: data.fullName, phone: data.phone || '', messengerUrl: data.messengerUrl || '', zaloUrl: data.zaloUrl || '', showPhone: Boolean(data.showPhone), showMessenger: Boolean(data.showMessenger), showZalo: Boolean(data.showZalo), currentPassword: '', newPassword: '', confirmPassword: '' }));
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

  return <div className="authenticated-page min-h-screen bg-white">
    <AuthenticatedNavigation />
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] pb-16 pt-5 sm:w-[calc(100%-3rem)]">
      <header>
        <p className="font-semibold text-[#237596]">Tài khoản</p>
        <h1 className="mt-1 text-3xl font-bold text-[#14252c] sm:text-4xl">Cài đặt tài khoản</h1>
        <p className="mt-2 text-slate-600">Cập nhật thông tin cá nhân hoặc đổi mật khẩu đăng nhập.</p>
      </header>

      <form onSubmit={submit} className="mt-7 space-y-6">
        <section className="rounded-[28px] border border-[#9fc5d4] bg-white p-5 sm:p-7" aria-labelledby="personal-info-title">
          <h2 id="personal-info-title" className="flex items-center gap-2 text-xl font-semibold"><UserRound className="text-[#237596]" />Thông tin cá nhân</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Tên người dùng<input name="fullName" value={form.fullName} onChange={change} disabled={loading || saving} maxLength={255} required className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium">Số điện thoại<input name="phone" type="tel" value={form.phone} onChange={change} disabled={loading || saving} maxLength={20} placeholder="Không bắt buộc" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium">URL Messenger<input name="messengerUrl" type="url" value={form.messengerUrl} onChange={change} disabled={loading || saving} maxLength={500} placeholder="https://m.me/ten-cua-ban" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium">URL Zalo<input name="zaloUrl" type="url" value={form.zaloUrl} onChange={change} disabled={loading || saving} maxLength={500} placeholder="https://zalo.me/..." className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596] disabled:bg-slate-100" /></label>
            <label className="block text-sm font-medium sm:col-span-2">Email<input value={email} disabled className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-slate-500" /><span className="mt-1 block text-xs font-normal text-slate-500">Email đăng nhập hiện chưa hỗ trợ thay đổi.</span></label>
          </div>
          <div className="mt-6"><h3 className="font-semibold">Thông tin hiển thị khi người khác liên hệ</h3><p className="mt-1 text-xs text-slate-500">Chỉ những mục được bật mới xuất hiện trên hồ sơ và danh sách liên hệ.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><PrivacySwitch label="Số điện thoại" checked={form.showPhone} disabled={!form.phone || loading || saving} onChange={(event) => setForm((current) => ({ ...current, showPhone: event.target.checked }))} /><PrivacySwitch label="Messenger" checked={form.showMessenger} disabled={!form.messengerUrl || loading || saving} onChange={(event) => setForm((current) => ({ ...current, showMessenger: event.target.checked }))} /><PrivacySwitch label="Zalo" checked={form.showZalo} disabled={!form.zaloUrl || loading || saving} onChange={(event) => setForm((current) => ({ ...current, showZalo: event.target.checked }))} /></div></div>
        </section>

        <section className="rounded-[28px] border border-[#9fc5d4] bg-white p-5 sm:p-7" aria-labelledby="password-title">
          <h2 id="password-title" className="flex items-center gap-2 text-xl font-semibold"><KeyRound className="text-[#237596]" />Đổi mật khẩu</h2>
          <p className="mt-2 text-sm text-slate-500">Để trống cả ba ô nếu bạn chỉ muốn sửa thông tin cá nhân.</p>
          <div className="mt-5 grid gap-4">
            <label className="block text-sm font-medium">Mật khẩu hiện tại<input name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={change} disabled={loading || saving} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Mật khẩu mới<input name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={change} disabled={loading || saving} maxLength={72} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
              <label className="block text-sm font-medium">Nhập lại mật khẩu mới<input name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={change} disabled={loading || saving} maxLength={72} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
            </div>
          </div>
        </section>

        {message && <p role="status" className={`rounded-[24px] border p-4 text-sm ${success ? 'border-[#237596] bg-[#eef8fc] text-[#237596]' : 'border-red-200 bg-red-50 text-red-700'}`}>{message}</p>}
        <button type="submit" disabled={loading || saving} className="ml-auto flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#237596] px-7 font-semibold text-white disabled:opacity-50 sm:w-auto"><Save className="h-5 w-5" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>
    </main>
  </div>;
}
