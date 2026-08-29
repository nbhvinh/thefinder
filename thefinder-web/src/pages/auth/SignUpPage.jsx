import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/authApi';
import BrandLogo from '../../components/navigation/BrandLogo';

export default function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const fields = [
    { id: 'fullName', label: 'Họ và tên', type: 'text', autoComplete: 'name' },
    { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { id: 'phone', label: 'Số điện thoại (không bắt buộc)', type: 'tel', autoComplete: 'tel' },
    { id: 'password', label: 'Mật khẩu', type: 'password', autoComplete: 'new-password' },
    { id: 'confirmPassword', label: 'Xác nhận mật khẩu', type: 'password', autoComplete: 'new-password' },
  ];
  const change = (event) => { const { name, value } = event.target; setFormData((current) => ({ ...current, [name]: value })); setStatusMessage(''); };
  async function submit(event) {
    event.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) { setStatusMessage('Vui lòng điền họ tên, email và mật khẩu.'); return; }
    if (formData.password.length < 4) { setStatusMessage('Mật khẩu tối thiểu 4 ký tự.'); return; }
    if (formData.password !== formData.confirmPassword) { setStatusMessage('Mật khẩu xác nhận không khớp.'); return; }
    try {
      setIsSubmitting(true); await register({ fullName: formData.fullName.trim(), email: formData.email.trim(), phone: formData.phone.trim(), password: formData.password });
      navigate('/sign-in', { state: { message: 'Đăng ký thành công. Hãy đăng nhập.' } });
    } catch (error) { setStatusMessage(error.response?.data || 'Không thể đăng ký. Vui lòng thử lại.'); } finally { setIsSubmitting(false); }
  }
  return <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(#ffffff66,#ffffff66),url('/assets/anima/public-home/signup.png')] bg-cover bg-center pt-[74px]"><div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[100px] text-[#00000080] xl:block">Welcome you!</div><div className="relative mx-auto flex min-h-[calc(100vh-74px)] max-w-[546px] items-center py-12"><section aria-labelledby="signup-title" className="relative z-10 w-full rounded-[40px] border border-[#237596] bg-[#e1e1e1] px-[76px] py-16"><h1 id="signup-title" className="text-center text-4xl text-black">Đăng ký</h1><form onSubmit={submit} noValidate className="mt-10 space-y-3">{fields.map((field) => <label key={field.id} htmlFor={field.id} className="block text-base text-[#1e1e1e]">{field.label}<input id={field.id} name={field.id} type={field.type} value={formData[field.id]} onChange={change} autoComplete={field.autoComplete} required={field.id !== 'phone'} className="mt-1 block h-10 w-full rounded-[30px] border border-[#d9d9d9] bg-white px-4 text-black outline-none focus:border-[#237596]" /></label>)}<p className="pt-1 text-center text-[15px]">Đã có tài khoản? <Link to="/sign-in" className="text-[#237596]">Đăng nhập</Link></p><button type="submit" disabled={isSubmitting} className="mx-auto flex h-[50px] w-[255px] items-center justify-center rounded-[50px] bg-[#237596] text-xl text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Đang đăng ký...' : 'Xác nhận'}</button></form><button type="button" onClick={() => setStatusMessage('Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.')} className="mx-auto mt-4 flex h-[26px] w-[104px] items-center justify-center rounded-[30px] border border-[#1882ac] bg-white text-sm">Help me!</button><p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-[#237596]">{statusMessage}</p></section></div><header className="fixed left-0 top-0 z-20 flex h-[74px] w-full items-center bg-[#e9e9e9] px-4"><Link to="/" aria-label="TheFinder trang chủ" className="mx-auto flex w-full max-w-[1244px] items-center gap-2"><BrandLogo /><span className="text-xl text-black">TheFinder</span></Link></header></main>;
}
