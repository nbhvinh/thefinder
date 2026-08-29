import { MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BrandLogo from './BrandLogo';

const links = [{ label: 'Trang chủ', to: '/home' }, { label: 'Đồ bị mất', to: '/home/lost' }, { label: 'Đồ trả lại', to: '/home/found' }, { label: 'Báo cáo trộm cắp', to: '/stolen', disabled: true }];
export default function AuthenticatedNavigation() {
  const [query, setQuery] = useState(''); const navigate = useNavigate();
  const search = (event) => { event.preventDefault(); if (query.trim()) navigate(`/home?keyword=${encodeURIComponent(query.trim())}`); };
  return <header className="sticky top-0 z-50 h-[74px] bg-[#e9e9e9] px-4"><div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-5"><div className="flex items-center gap-3"><Link to="/home" aria-label="TheFinder - Trang chủ" className="flex items-center gap-2"><BrandLogo /><span className="text-xl text-black">TheFinder</span></Link><form onSubmit={search} className="hidden sm:block"><label className="sr-only" htmlFor="authenticated-search">Tìm kiếm</label><input id="authenticated-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="🔍 Tìm kiếm (ví, giấy, ...)" className="h-8 w-[180px] rounded-[20px] border border-[#1882ac] bg-[#edecec] px-4 text-xs text-black outline-none" /></form></div><nav className="hidden lg:block" aria-label="Điều hướng chính"><ul className="flex gap-[18px]">{links.map((link) => <li key={link.to}>{link.disabled ? <span aria-disabled="true" className="cursor-not-allowed text-[15px] text-black/40" title="Tính năng đang tạm khóa">{link.label}</span> : <Link className="text-[15px] text-black hover:text-[#237596]" to={link.to}>{link.label}</Link>}</li>)}</ul></nav><div className="flex items-center gap-6"><button type="button" aria-label="Tin nhắn"><MessageCircle className="h-[35px] w-[35px]" /></button><Link to="/account" className="flex h-10 w-[143px] items-center justify-center rounded-[30px] border border-[#1882ac] bg-white text-[15px] text-black">Tài khoản</Link></div></div></header>;
}
