import { Bell, Hash, House, LogIn, Menu, MessageCircle, PenLine, UserRound, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import BrandLogo from './BrandLogo';
import CreatePostMenu from './CreatePostMenu';
import SearchAutocomplete from './SearchAutocomplete';
import { getCategories } from '../../api/categoryApi';
import LostItemStats from './LostItemStats';
import useScrollChromeVisibility from '../../hooks/useScrollChromeVisibility';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const navigationItems = [
  { label: 'Trang chủ', to: '/', end: true },
  { label: 'Đồ bị mất', to: '/lost' },
  { label: 'Đồ trả lại', to: '/found' },
  { label: 'Báo cáo trộm cắp', to: '/stolen', disabled: true },
];

const fallbackCategories = [
  { id: 1, name: 'Balo/Túi xách' }, { id: 2, name: 'Ví/Giấy tờ' },
  { id: 3, name: 'Điện thoại' }, { id: 4, name: 'Laptop/Máy tính' },
  { id: 5, name: 'Bút/Văn phòng phẩm' }, { id: 6, name: 'Trang sức' },
  { id: 7, name: 'Chìa khóa' }, { id: 8, name: 'Thú cưng' }, { id: 9, name: 'Khác' },
];

export default function PublicNavigation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [categories, setCategories] = useState(fallbackCategories);
  const tagRef = useRef(null);
  const navigate = useNavigate();
  const isMobileChromeVisible = useScrollChromeVisibility();
  useBodyScrollLock(isMobileSearchFocused);

  useEffect(() => {
    getCategories().then((data) => {
      if (Array.isArray(data) && data.length) setCategories(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function closeTags(event) {
      if (!tagRef.current?.contains(event.target)) setIsTagsOpen(false);
    }
    document.addEventListener('pointerdown', closeTags);
    return () => document.removeEventListener('pointerdown', closeTags);
  }, []);

  const search = (keyword, categoryId) => {
    if (categoryId) navigate(`/?categoryId=${categoryId}`);
    else if (keyword.trim()) navigate(`/?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  const selectTag = (categoryId) => {
    setIsTagsOpen(false);
    navigate(`/?categoryId=${categoryId}`);
  };

  return <>
    {isMobileSearchFocused && <button type="button" aria-label="Đóng tìm kiếm" onClick={() => { document.activeElement?.blur(); setIsMobileSearchFocused(false); }} className="fixed inset-0 z-40 bg-black/25 lg:hidden" />}
    <header className={`sticky top-0 h-16 bg-transparent px-4 lg:h-auto lg:bg-white ${isMobileSearchFocused ? 'z-50' : 'z-40'}`}>
      <div className={`absolute inset-x-0 top-0 flex h-16 items-center gap-2 px-3 transition-transform duration-300 ease-out lg:hidden ${isMobileSearchFocused ? 'bg-transparent' : 'bg-white'} ${isMobileChromeVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Mở menu" aria-expanded={isMobileMenuOpen} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#237596] hover:bg-[#eef8fc]"><Menu className="h-6 w-6" /></button>
        <Link to="/" aria-label="TheFinder - Trang chủ" className="shrink-0"><BrandLogo className="h-10 w-10" /></Link>
        <Link to="/" className="font-brand shrink-0 text-base text-black">TheFinder</Link>
        <div className={`mobile-top-search absolute right-3 top-3 z-20 transition-[width] duration-300 ease-out ${isMobileSearchFocused ? 'mobile-top-search-expanded w-[calc(100%-24px)]' : 'w-[min(224px,45vw)]'}`}><SearchAutocomplete id="mobile-public-search" value={searchQuery} onChange={setSearchQuery} onSearch={search} onFocusChange={setIsMobileSearchFocused} inputClassName="!h-10 !w-full !px-3 focus:!w-full" /></div>
      </div>
      <nav className={`fixed inset-x-[70px] bottom-[max(10px,env(safe-area-inset-bottom))] z-40 mx-auto w-auto max-w-[780px] transition-transform duration-300 ease-out lg:static lg:flex lg:h-[70px] lg:w-full lg:translate-y-0 lg:items-end lg:pb-[10px] ${isMobileChromeVisible && !isMobileSearchFocused ? 'translate-y-0' : 'translate-y-[calc(100%+24px)]'}`} aria-label="Điều hướng chính">
        <ul className="grid w-full grid-cols-4 items-stretch gap-0 rounded-full border border-[#1882ac] bg-white p-1.5 shadow-[0_8px_30px_rgba(20,78,101,0.16)] lg:gap-4 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {navigationItems.map((item) => <li key={item.to} className="text-center">
            {item.disabled
              ? <span aria-disabled="true" title="Tính năng đang tạm khóa" className="inline-flex h-full min-h-11 items-center justify-center rounded-full px-1 text-[10px] leading-tight text-black/35 sm:px-3 sm:text-sm lg:min-h-10 lg:text-[15px]"><span>Báo cáo<br className="lg:hidden" /> trộm cắp</span></span>
              : <NavLink end={item.end} to={item.to} className={({ isActive }) => `relative inline-flex h-full min-h-11 w-full items-center justify-center rounded-full px-1 text-[10px] font-medium leading-tight transition-colors sm:px-3 sm:text-sm lg:min-h-12 lg:w-auto lg:px-8 lg:text-[15px] ${isActive ? 'bg-[#237596] text-white lg:bg-transparent lg:text-black lg:after:absolute lg:after:inset-x-8 lg:after:bottom-0 lg:after:h-[5px] lg:after:rounded-full lg:after:bg-[#237596] lg:after:content-[""]' : 'text-black hover:bg-[#eef8fc] hover:text-[#237596]'}`}>{item.label}</NavLink>}
          </li>)}
        </ul>
      </nav>
    </header>

    {isMobileMenuOpen && <button type="button" aria-label="Đóng menu" onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/25 lg:hidden" />}
    <aside className={`authenticated-sidebar fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-white p-5 shadow-xl transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Tiện ích khách">
      <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Đóng menu" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-black/65 hover:bg-[#eef8fc] lg:hidden"><X className="h-5 w-5" /></button>
      <Link to="/" aria-label="TheFinder - Trang chủ" className="flex items-center gap-3 px-2"><BrandLogo className="h-12 w-12" /><span className="font-brand text-xl text-black">TheFinder</span></Link>
      <div className="mt-5"><SearchAutocomplete id="site-search" value={searchQuery} onChange={setSearchQuery} onSearch={search} onFocusChange={() => {}} textSize="text-sm" inputClassName="!h-11 !w-full !bg-white focus:!w-full" /></div>

      <div className="mt-5 flex flex-col gap-1.5">
        <NavLink end to="/" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `sidebar-action${isActive ? ' sidebar-action-active' : ''}`}><House /><span>Trang chính</span></NavLink>
        <div className="sidebar-action"><PenLine /><span>Đăng bài</span><CreatePostMenu compact /></div>
        <button type="button" disabled className="sidebar-action" title="Đăng nhập để sử dụng"><MessageCircle /><span>Nhắn tin</span></button>
        <button type="button" disabled className="sidebar-action" title="Đăng nhập để sử dụng"><Bell /><span>Thông báo</span></button>
        <button type="button" onClick={() => navigate('/sign-in')} className="sidebar-action"><UserRound /><span>Trang cá nhân</span></button>
        <div ref={tagRef} className="relative">
          <button type="button" onClick={() => setIsTagsOpen((open) => !open)} aria-expanded={isTagsOpen} className="sidebar-action w-full"><Hash /><span>Tag</span></button>
          {isTagsOpen && <div className="absolute bottom-0 left-full z-50 ml-2 max-h-[min(18rem,calc(100vh-2rem))] w-[calc(100vw-292px)] max-w-60 overflow-auto rounded-2xl border border-[#1882ac] bg-white p-2 shadow-xl lg:ml-3 lg:w-60">{categories.map((category) => <button key={category.id} type="button" onClick={() => selectTag(category.id)} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm break-words hover:bg-[#eef8fc] hover:text-[#237596]">#{category.name}</button>)}</div>}
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <Link to="/sign-in" className="flex h-12 w-full items-center gap-3 rounded-full bg-[#237596] px-4 text-[15px] text-white hover:bg-[#185d79]"><LogIn className="h-5 w-5" /><span>Đăng nhập</span></Link>
        <Link to="/sign-up" className="flex h-11 w-full items-center justify-center rounded-full text-sm text-[#237596] hover:bg-[#eef8fc]">Tạo tài khoản</Link>
      </div>
    </aside>
    <LostItemStats />
  </>;
}
