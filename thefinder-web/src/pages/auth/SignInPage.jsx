import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../api/authApi';
import BrandLogo from '../../components/navigation/BrandLogo';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) { setStatusMessage('Vui lòng nhập email và mật khẩu.'); return; }
    try {
      setIsSubmitting(true); setStatusMessage('');
      const response = await login({ email: email.trim(), password });
      sessionStorage.setItem('thefinder-authenticated', 'true');
      sessionStorage.setItem('thefinder-user-name', response.data.fullName);
      navigate(location.state?.from || '/home');
    } catch (error) {
      setStatusMessage(error.response?.data || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally { setIsSubmitting(false); }
  }

  return <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(#00000080,#00000080),url('/assets/anima/public-home/menu.png')] bg-cover bg-center pt-[74px]"><div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[100px] text-[#00000080] xl:block">Welcome back!</div><div className="relative mx-auto flex min-h-[calc(100vh-74px)] max-w-[546px] items-center justify-center px-4 py-12"><div className="absolute h-[502px] w-[calc(100%-2rem)] translate-y-[125px] rounded-[40px] border border-[#237596] bg-[#0c408f]" /><div className="absolute h-[502px] w-[calc(100%-2rem)] translate-y-[95px] rounded-[40px] border border-[#237596] bg-[#ff3d3d]" /><div className="absolute h-[502px] w-[calc(100%-2rem)] translate-y-[65px] rounded-[40px] border border-[#237596] bg-[#ffa830]" /><div className="absolute h-[502px] w-[calc(100%-2rem)] translate-y-[35px] rounded-[40px] border border-[#237596] bg-[#ffe571]" /><div className="absolute h-[502px] w-[calc(100%-2rem)] translate-y-[5px] rounded-[40px] bg-[#3f796d]" /><section aria-labelledby="sign-in-heading" className="relative z-10 flex h-[502px] w-full flex-col rounded-[40px] border border-[#237596] bg-[#fff3ea] px-6 pb-5 pt-12 sm:px-[76px]"><h1 id="sign-in-heading" className="text-center text-4xl text-black">Đăng nhập</h1><form onSubmit={handleSubmit} className="mt-8 space-y-3"><label className="block text-base text-[#1e1e1e]" htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block h-12 w-full rounded-[30px] border border-[#d9d9d9] bg-white px-4 text-black outline-none focus:border-[#237596]" /></label><label className="block text-base text-[#1e1e1e]" htmlFor="password">Mật khẩu<input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block h-12 w-full rounded-[30px] border border-[#d9d9d9] bg-white px-4 text-black outline-none focus:border-[#237596]" /></label><p className="text-center text-[15px]">Chưa có tài khoản? <Link to="/sign-up" className="text-[#237596]">Đăng ký</Link></p><button type="submit" disabled={isSubmitting} className="mx-auto flex h-[50px] w-full max-w-[255px] items-center justify-center rounded-[50px] bg-[#237596] text-xl text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Đang đăng nhập...' : 'Xác nhận'}</button></form><button type="button" onClick={() => setHelpVisible((visible) => !visible)} aria-expanded={helpVisible} className="mx-auto mt-3 h-[26px] w-[104px] shrink-0 rounded-[30px] border border-[#1882ac] bg-white text-sm">Help me!</button><p aria-live="polite" className={`mt-1 min-h-4 text-center text-xs ${statusMessage || location.state?.message ? 'text-red-700' : 'text-[#237596]'}`}>{statusMessage || location.state?.message || (helpVisible ? 'Liên hệ bộ phận hỗ trợ nếu bạn cần trợ giúp đăng nhập.' : '')}</p></section></div><header className="fixed left-0 top-0 z-20 flex h-[74px] w-full items-center bg-[#e9e9e9] px-4"><Link to="/" aria-label="TheFinder - Trang chủ" className="mx-auto flex w-full max-w-[1244px] items-center gap-2"><BrandLogo /><span className="font-brand text-xl text-black">TheFinder</span></Link></header></main>;
}
