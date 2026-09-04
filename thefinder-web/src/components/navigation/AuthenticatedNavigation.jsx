import { Hash, House, Inbox, Menu, MessageCircle, PenLine, Send, Settings, ShieldCheck, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import BrandLogo from './BrandLogo';
import CreatePostMenu from './CreatePostMenu';
import SearchAutocomplete from './SearchAutocomplete';
import { getCurrentUser, logout } from '../../api/authApi';
import { getCategories } from '../../api/categoryApi';
import LostItemStats from './LostItemStats';
import NotificationCenter from './NotificationCenter';
import useScrollChromeVisibility from '../../hooks/useScrollChromeVisibility';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { getContactSuggestions } from '../../api/userApi';

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
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('thefinder-user-role') || 'USER');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [categories, setCategories] = useState(fallbackCategories);
  const accountRef = useRef(null);
  const tagRef = useRef(null);
  const adminRef = useRef(null);
  const contactRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobileChromeVisible = useScrollChromeVisibility();
  useBodyScrollLock(isMobileSearchFocused);
  const drawerMode = pathname.startsWith('/posts/create/')
    || /^\/posts\/[^/]+\/claim$/.test(pathname);

  useEffect(() => {
    getCurrentUser().then((response) => {
      setUserName(response.data.fullName);
      setUserRole(response.data.role || 'USER');
      sessionStorage.setItem('thefinder-user-name', response.data.fullName);
      sessionStorage.setItem('thefinder-user-role', response.data.role || 'USER');
    }).catch(() => {});
    getCategories().then((data) => {
      if (Array.isArray(data) && data.length) setCategories(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const updateName = (event) => setUserName(event.detail?.fullName || sessionStorage.getItem('thefinder-user-name') || 'Tài khoản');
    window.addEventListener('thefinder:account-updated', updateName);
    return () => window.removeEventListener('thefinder:account-updated', updateName);
  }, []);

  useEffect(() => {
    function closeMenus(event) {
      if (!accountRef.current?.contains(event.target)) setIsAccountOpen(false);
      if (!tagRef.current?.contains(event.target)) setIsTagsOpen(false);
      if (!adminRef.current?.contains(event.target)) setIsAdminOpen(false);
      if (!contactRef.current?.contains(event.target)) setIsContactOpen(false);
    }
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  async function handleLogout() {
    try { await logout(); } catch { /* Vẫn xóa phiên cục bộ nếu backend không phản hồi. */ }
    sessionStorage.removeItem('thefinder-authenticated');
    sessionStorage.removeItem('thefinder-user-name');
    sessionStorage.removeItem('thefinder-user-role');
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

  async function toggleContacts() {
    const opening = !isContactOpen;
    setIsContactOpen(opening);
    if (!opening) return;
    try {
      setContactsLoading(true);
      setContacts(await getContactSuggestions());
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }

  return <>
    {isMobileSearchFocused && <button type="button" aria-label="Đóng tìm kiếm" onClick={() => { document.activeElement?.blur(); setIsMobileSearchFocused(false); }} className="fixed inset-0 z-40 bg-black/25 lg:hidden" />}
    <header className={`sticky top-0 h-16 bg-transparent px-4 lg:h-auto lg:bg-white ${isMobileSearchFocused ? 'z-50' : 'z-40'}`}>
      <div className={`absolute inset-x-0 top-0 flex h-16 items-center gap-2 px-3 transition-transform duration-300 ease-out lg:hidden ${isMobileSearchFocused ? 'bg-transparent' : 'bg-white'} ${isMobileChromeVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Mở menu" aria-expanded={isMobileMenuOpen} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#237596] hover:bg-[#eef8fc]"><Menu className="h-6 w-6" /></button>
        <Link to="/home" aria-label="TheFinder - Trang chủ" className="shrink-0"><BrandLogo className="h-10 w-10" /></Link>
        <Link to="/home" className="font-brand shrink-0 text-base text-black">TheFinder</Link>
        <div className={`mobile-top-search absolute right-3 top-3 z-20 transition-[width] duration-300 ease-out ${isMobileSearchFocused ? 'mobile-top-search-expanded w-[calc(100%-24px)]' : 'w-[min(224px,45vw)]'}`}><SearchAutocomplete id="mobile-authenticated-search" value={query} onChange={setQuery} onSearch={search} onFocusChange={setIsMobileSearchFocused} inputClassName="!h-10 !w-full !px-3 focus:!w-full" /></div>
      </div>
      {drawerMode && <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Mở menu" aria-expanded={isMobileMenuOpen} className="absolute bottom-[15px] left-3 z-10 hidden h-10 w-10 place-items-center rounded-full text-[#237596] hover:bg-[#eef8fc] lg:grid"><Menu className="h-6 w-6" /></button>}
      <nav className={`fixed inset-x-[70px] bottom-[max(10px,env(safe-area-inset-bottom))] z-40 mx-auto w-auto max-w-[780px] transition-transform duration-300 ease-out lg:static lg:flex lg:h-[70px] lg:w-full lg:translate-y-0 lg:items-end lg:pb-[10px] ${isMobileChromeVisible && !isMobileSearchFocused ? 'translate-y-0' : 'translate-y-[calc(100%+24px)]'}`} aria-label="Điều hướng chính">
        <ul className="grid w-full grid-cols-4 items-stretch gap-0 rounded-full border border-[#1882ac] bg-white p-1.5 shadow-[0_8px_30px_rgba(20,78,101,0.16)] lg:gap-4 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {links.map((link) => <li key={link.to} className="text-center">
            {link.disabled
              ? <span aria-disabled="true" title="Tính năng đang tạm khóa" className="inline-flex h-full min-h-11 items-center justify-center rounded-full px-1 text-[10px] leading-tight text-black/35 sm:px-3 sm:text-sm lg:min-h-10 lg:text-[15px]"><span>Báo cáo<br className="lg:hidden" /> trộm cắp</span></span>
              : <NavLink end={link.end} to={link.to} className={({ isActive }) => `relative inline-flex h-full min-h-11 w-full items-center justify-center rounded-full px-1 text-[10px] font-medium leading-tight transition-colors sm:px-3 sm:text-sm lg:min-h-12 lg:w-auto lg:px-8 lg:text-[15px] ${isActive ? 'bg-[#237596] text-white lg:bg-transparent lg:text-black lg:after:absolute lg:after:inset-x-8 lg:after:bottom-0 lg:after:h-[5px] lg:after:rounded-full lg:after:bg-[#237596] lg:after:content-[""]' : 'text-black hover:bg-[#eef8fc] hover:text-[#237596]'}`}>{link.label}</NavLink>}
          </li>)}
        </ul>
      </nav>
    </header>

    {isMobileMenuOpen && <button type="button" aria-label="Đóng menu" onClick={() => setIsMobileMenuOpen(false)} className={`fixed inset-0 z-40 bg-black/25 ${drawerMode ? '' : 'lg:hidden'}`} />}
    <aside className={`authenticated-sidebar fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-white p-5 shadow-xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${drawerMode ? '' : 'lg:translate-x-0 lg:shadow-none'}`} aria-label="Tiện ích tài khoản">
      <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Đóng menu" className={`absolute right-3 top-3 h-9 w-9 place-items-center rounded-full text-black/65 hover:bg-[#eef8fc] ${drawerMode ? 'grid' : 'grid lg:hidden'}`}><X className="h-5 w-5" /></button>
      <Link to="/home" aria-label="TheFinder - Trang chủ" className="flex items-center gap-3 px-2">
        <BrandLogo className="h-12 w-12" />
        <span className="font-brand text-xl text-black">TheFinder</span>
      </Link>

      <div className="mt-5">
        <SearchAutocomplete id="authenticated-search" value={query} onChange={setQuery} onSearch={search} onFocusChange={() => {}} textSize="text-sm" inputClassName="!h-11 !w-full !bg-white focus:!w-full" />
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <NavLink end to="/home" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `sidebar-action${isActive ? ' sidebar-action-active' : ''}`}><House /><span>Trang chính</span></NavLink>
        <div className="sidebar-action"><PenLine /><span>Đăng bài</span><CreatePostMenu isAuthenticated compact /></div>
        <div ref={contactRef} className="relative"><button type="button" onClick={toggleContacts} aria-expanded={isContactOpen} className="sidebar-action w-full"><MessageCircle /><span>Liên hệ</span></button>{isContactOpen && <div className="fixed inset-x-4 top-1/2 z-50 max-h-[min(26rem,calc(100vh-2rem))] -translate-y-1/2 overflow-auto rounded-2xl border border-[#1882ac] bg-white p-2 shadow-xl lg:absolute lg:inset-x-auto lg:left-full lg:top-0 lg:ml-3 lg:w-72 lg:translate-y-0"><p className="px-3 py-2 text-xs text-slate-500">Gợi ý từ các đơn đang được kiểm tra</p>{contactsLoading ? <p className="p-4 text-center text-sm text-slate-500">Đang tải...</p> : contacts.length ? contacts.map((contact) => <Link key={contact.id} to={`/users/${contact.id}`} onClick={() => { setIsContactOpen(false); setIsMobileMenuOpen(false); }} className="block rounded-xl px-3 py-3 hover:bg-[#eef8fc]"><span className="block font-semibold">{contact.fullName}</span><span className="mt-1 block truncate text-xs text-slate-500">{contact.phone || (contact.messengerUrl ? 'Messenger' : contact.zaloUrl ? 'Zalo' : 'Xem trang cá nhân')}</span></Link>) : <p className="p-4 text-center text-sm text-slate-500">Chưa có liên hệ được gợi ý.</p>}</div>}</div>
        <NavLink to="/claims/received" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `sidebar-action${isActive ? ' sidebar-action-active' : ''}`}><Inbox /><span>Các đơn nhận được</span></NavLink>
        <NavLink to="/claims/sent" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `sidebar-action${isActive ? ' sidebar-action-active' : ''}`}><Send /><span>Các đơn đã gửi</span></NavLink>
        <NotificationCenter />
        <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `sidebar-action${isActive ? ' sidebar-action-active' : ''}`}><UserRound /><span>Trang cá nhân</span></NavLink>
        <div ref={tagRef} className="relative">
          <button type="button" onClick={() => setIsTagsOpen((open) => !open)} aria-expanded={isTagsOpen} className="sidebar-action w-full"><Hash /><span>Tag</span></button>
          {isTagsOpen && <div className="absolute bottom-0 left-full z-50 ml-2 max-h-[min(18rem,calc(100vh-2rem))] w-[calc(100vw-292px)] max-w-60 overflow-auto rounded-2xl border border-[#1882ac] bg-white p-2 shadow-xl lg:ml-3 lg:w-60">
            {categories.map((category) => <button key={category.id} type="button" onClick={() => selectTag(category.id)} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm break-words hover:bg-[#eef8fc] hover:text-[#237596]">#{category.name}</button>)}
          </div>}
        </div>
      </div>

      {userRole === 'ADMIN' && <div ref={adminRef} className="relative mt-auto mb-2">
        {isAdminOpen && <div className="absolute bottom-0 left-full z-50 ml-2 w-[calc(100vw-292px)] max-w-60 rounded-2xl border border-[#1882ac] bg-white p-2 shadow-xl lg:ml-3 lg:w-60"><NavLink to="/admin/reports" onClick={() => { setIsAdminOpen(false); setIsMobileMenuOpen(false); }} className="block rounded-xl px-4 py-3 text-sm hover:bg-[#eef8fc] hover:text-[#237596]">Các bài viết bị báo cáo</NavLink><NavLink to="/admin/blacklist" onClick={() => { setIsAdminOpen(false); setIsMobileMenuOpen(false); }} className="mt-1 block rounded-xl px-4 py-3 text-sm hover:bg-[#eef8fc] hover:text-[#237596]">Blacklist</NavLink></div>}
        <button type="button" onClick={() => setIsAdminOpen((open) => !open)} aria-expanded={isAdminOpen} className="sidebar-action w-full border border-[#1882ac]"><ShieldCheck /><span>Quản lý (admin)</span></button>
      </div>}

      <div ref={accountRef} className={`relative ${userRole === 'ADMIN' ? '' : 'mt-auto'}`}>
        {isAccountOpen && <div className="absolute bottom-0 left-full z-50 ml-2 w-[calc(100vw-292px)] max-w-60 rounded-xl border border-[#1882ac] bg-white p-1 shadow-lg lg:ml-3 lg:w-60"><NavLink to="/settings" onClick={() => { setIsAccountOpen(false); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm hover:bg-[#eef8fc] hover:text-[#237596]"><Settings className="h-4 w-4" />Cài đặt tài khoản</NavLink><button type="button" onClick={handleLogout} className="mt-1 block w-full rounded-lg px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50">Đăng xuất</button></div>}
        <button type="button" onClick={() => setIsAccountOpen((open) => !open)} aria-expanded={isAccountOpen} className="flex h-12 w-full items-center gap-3 rounded-full border border-[#1882ac] bg-white px-4 text-left text-[15px] text-black hover:bg-[#eef8fc]"><UserRound className="h-5 w-5 shrink-0 text-[#237596]" /><span className="truncate">{userName}</span></button>
      </div>
    </aside>
    {!drawerMode && <LostItemStats />}
  </>;
}
