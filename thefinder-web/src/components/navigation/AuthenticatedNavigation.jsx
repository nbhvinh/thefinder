import { Bell, Hash, Menu, MessageCircle, PenLine, UserRound, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import BrandLogo from './BrandLogo';
import CreatePostMenu from './CreatePostMenu';
import SearchAutocomplete from './SearchAutocomplete';
import { getCurrentUser, logout } from '../../api/authApi';
import { getCategories } from '../../api/categoryApi';
import LostItemStats from './LostItemStats';

const links = [
  { label: 'Trang chủ', to: '/home', end: true },
  { label: 'Đồ bị mất', to: '/home/lost' },
  { label: 'Đồ trả lại', to: '/home/found' },
  { label: 'Báo cáo trộm cắp', to: '/stolen', disabled: true },
];

const fallbackCategories = [
  { id: 1, name: 'Balo/Túi xách' }, { id: 2, name: 'Ví/Giấy tờ' },
  { id: 3, name: 'Điện thoại' }, { id: 4, name: 'Laptop/Máy tính' },
  { id: 5, name: 'Bút/Văn phòng phẩm' }, { id: 6, name: 'Trang sức' },
  { id: 7, name: 'Chìa khóa' }, { id: 8, name: 'Thú cưng' }, { id: 9, name: 'Khác' },
];

export default function AuthenticatedNavigation() {
  const [query, setQuery] = useState('');
  const [userName, setUserName] = useState(() => sessionStorage.getItem('thefinder-user-name') || 'Tài khoản');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState(fallbackCategories);
  const accountRef = useRef(null);
  const tagRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then((response) => {
      setUserName(response.data.fullName);
      sessionStorage.setItem('thefinder-user-name', response.data.fullName);
    }).catch(() => {});
    getCategories().then((data) => {
      if (Array.isArray(data) && data.length) setCategories(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function closeMenus(event) {
      if (!accountRef.current?.contains(event.target)) setIsAccountOpen(false);
      if (!tagRef.current?.contains(event.target)) setIsTagsOpen(false);
    }
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  async function handleLogout() {
    try { await logout(); } catch { /* Vẫn xóa phiên cục bộ nếu backend không phản hồi. */ }
    sessionStorage.removeItem('thefinder-authenticated');
    sessionStorage.removeItem('thefinder-user-name');
    navigate('/', { replace: true });
  }

  const search = (keyword, categoryId) => {
    if (categoryId) navigate(`/home?categoryId=${categoryId}`);
    else if (keyword.trim()) navigate(`/home?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  const selectTag = (categoryId) => {
    setIsTagsOpen(false);
    navigate(`/home?categoryId=${categoryId}`);
  };

  return <>
    <header className="sticky top-0 z-40 bg-white px-4">
      <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Mở menu" aria-expanded={isMobileMenuOpen} className="absolute bottom-[15px] left-3 z-10 grid h-10 w-10 place-items-center rounded-full text-[#237596] hover:bg-[#eef8fc] lg:hidden"><Menu className="h-6 w-6" /></button>
      <nav className="mx-auto flex h-[70px] w-full max-w-[780px] items-end pb-[10px] pl-11 lg:pl-0" aria-label="Điều hướng chính">
        <ul className="grid w-full grid-cols-4 gap-2 sm:gap-4">
          {links.map((link) => <li key={link.to} className="text-center">
            {link.disabled
              ? <span aria-disabled="true" title="Tính năng đang tạm khóa" className="inline-flex min-h-10 items-center justify-center rounded-full px-2 text-xs text-black/35 sm:px-4 sm:text-[15px]">{link.label}</span>
              : <NavLink end={link.end} to={link.to} className={({ isActive }) => `inline-flex min-h-10 items-center justify-center rounded-full border px-2 text-xs transition-colors sm:px-5 sm:text-[15px] ${isActive ? 'border-[#1882ac] bg-white text-[#237596]' : 'border-transparent text-black hover:bg-white/60 hover:text-[#237596]'}`}>{link.label}</NavLink>}
          </li>)}
        </ul>
      </nav>
    </header>

    {isMobileMenuOpen && <button type="button" aria-label="Đóng menu" onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/25 lg:hidden" />}
    <aside className={`authenticated-sidebar fixed inset-y-0 left-0 z-50 w-[276px] flex-col bg-white p-5 shadow-xl lg:flex lg:shadow-none ${isMobileMenuOpen ? 'flex' : 'hidden'}`} aria-label="Tiện ích tài khoản">
      <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Đóng menu" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-black/65 hover:bg-[#eef8fc] lg:hidden"><X className="h-5 w-5" /></button>
      <Link to="/home" aria-label="TheFinder - Trang chủ" className="flex items-center gap-3 px-2">
        <BrandLogo className="h-12 w-12" />
        <span className="font-brand text-xl text-black">TheFinder</span>
      </Link>

      <div className="mt-5">
        <SearchAutocomplete id="authenticated-search" value={query} onChange={setQuery} onSearch={search} onFocusChange={() => {}} textSize="text-sm" inputClassName="!h-11 !w-full !bg-white focus:!w-full" />
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <div className="sidebar-action"><PenLine /><span>Đăng bài</span><CreatePostMenu isAuthenticated compact /></div>
        <button type="button" disabled className="sidebar-action" title="Tính năng đang được phát triển"><MessageCircle /><span>Nhắn tin</span></button>
        <button type="button" disabled className="sidebar-action" title="Tính năng đang được phát triển"><Bell /><span>Thông báo</span></button>
        <button type="button" disabled className="sidebar-action" title="Tính năng đang được phát triển"><UserRound /><span>Trang cá nhân</span></button>

        <div ref={tagRef} className="relative">
          <button type="button" onClick={() => setIsTagsOpen((open) => !open)} aria-expanded={isTagsOpen} className="sidebar-action w-full"><Hash /><span>Tag</span></button>
          {isTagsOpen && <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-60 overflow-auto rounded-2xl border border-[#1882ac] bg-white p-2 shadow-xl lg:bottom-0 lg:left-full lg:top-auto lg:ml-3 lg:mt-0">
            {categories.map((category) => <button key={category.id} type="button" onClick={() => selectTag(category.id)} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm hover:bg-[#eef8fc] hover:text-[#237596]">#{category.name}</button>)}
          </div>}
        </div>
      </div>

      <div ref={accountRef} className="relative mt-auto">
        {isAccountOpen && <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-[#1882ac] bg-white p-1 shadow-lg"><button type="button" onClick={handleLogout} className="block w-full rounded-lg px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50">Đăng xuất</button></div>}
        <button type="button" onClick={() => setIsAccountOpen((open) => !open)} aria-expanded={isAccountOpen} className="flex h-12 w-full items-center gap-3 rounded-full border border-[#1882ac] bg-white px-4 text-left text-[15px] text-black hover:bg-[#eef8fc]"><UserRound className="h-5 w-5 shrink-0 text-[#237596]" /><span className="truncate">{userName}</span></button>
      </div>
    </aside>
    <LostItemStats />
  </>;
}
