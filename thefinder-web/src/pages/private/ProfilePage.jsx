import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Ellipsis, MapPin, Pencil, SearchX, Trash2 } from 'lucide-react';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import { getCurrentUser } from '../../api/authApi';
import { getMyClaims } from '../../api/claimApi';
import { getMyPosts, getPosts } from '../../api/postApi';

const filters = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang hoạt động' },
  { value: 'RESOLVED', label: 'Thành công' },
  { value: 'CLOSED', label: 'Đã điền đơn' },
];

const statusLabels = { OPEN: 'Đang hoạt động', RESOLVED: 'Đã tìm thấy', CLOSED: 'Đã đóng' };
const typeLabels = { LOST: 'Tìm đồ', FOUND: 'Trả đồ', STOLEN: 'Cảnh báo' };
const pageLoadedAt = Date.now();

function formatDate(value) {
  if (!value) return 'Chưa rõ thời gian';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function imageUrl(post) {
  const url = post.images?.[0]?.url;
  if (!url) return null;
  return url.startsWith('http') ? url : `http://localhost:8080${url}`;
}

function ProfilePostCard({ post }) {
  const cover = imageUrl(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function closeMenu(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, []);

  return <article className="group overflow-hidden rounded-[24px] border border-[#bdd7e2] bg-white transition hover:-translate-y-0.5 hover:border-[#237596] hover:shadow-[0_14px_35px_rgba(35,117,150,0.12)]">
    <div className="relative aspect-[16/10] overflow-hidden bg-[#e8f2f6]">
      {cover
        ? <img src={cover} alt={`Ảnh bài đăng ${post.title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
        : <div className="grid h-full place-items-center px-5 text-center text-sm text-[#6c8792]">Bài đăng chưa có hình ảnh</div>}
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${post.type === 'FOUND' ? 'bg-white text-[#176c8d]' : 'bg-[#237596] text-white'}`}>{typeLabels[post.type] ?? post.type}</span>
      <div ref={menuRef} className="absolute right-3 top-3 z-10">
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={`Tùy chọn bài viết ${post.title}`} aria-expanded={menuOpen} className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#18323d] shadow-md transition hover:bg-[#eef8fc]"><Ellipsis className="h-5 w-5" /></button>
        {menuOpen && <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-[#bdd7e2] bg-white p-1.5 text-sm shadow-xl">
          <button type="button" onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[#18323d] hover:bg-[#eef8fc]"><Pencil className="h-4 w-4 text-[#237596]" />Chỉnh sửa bài viết</button>
          <button type="button" onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />Xóa bài viết</button>
        </div>}
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-[#15252c]">{post.title}</h2>
        <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${post.status === 'OPEN' ? 'bg-[#e5f5ed] text-[#287553]' : post.status === 'RESOLVED' ? 'bg-[#e6f2f7] text-[#176c8d]' : 'bg-slate-100 text-slate-500'}`}>{statusLabels[post.status] ?? post.status}</span>
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{post.description || 'Không có mô tả.'}</p>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#237596]" />{post.location || 'Chưa có địa điểm'}</span>
        <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-[#237596]" />{formatDate(post.eventTime || post.createdAt)}</span>
      </div>
    </div>
  </article>;
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sentClaims, setSentClaims] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const userResponse = await getCurrentUser();
        if (!active) return;
        const currentUser = userResponse.data;
        setUser(currentUser);
        const postsRequest = getMyPosts().catch(async () => {
          const allPosts = await getPosts({ size: 1000 });
          return allPosts.filter((post) => Number(post.authorId) === Number(currentUser.id));
        });
        const [myPosts, myClaims] = await Promise.all([
          postsRequest,
          getMyClaims().catch(() => []),
        ]);
        if (active) {
          setPosts(Array.isArray(myPosts) ? myPosts : []);
          setSentClaims(Array.isArray(myClaims) ? myClaims : []);
        }
      } catch {
        if (active) setError('Không thể tải trang cá nhân. Hãy thử lại sau.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, []);

  const visiblePosts = useMemo(
    () => filter === 'ALL' ? posts : posts.filter((post) => post.status === filter),
    [filter, posts],
  );
  const resolvedClaimsCount = sentClaims.filter((claim) => claim.status === 'CONFIRMED').length;
  const reputation = sentClaims.length === 0
    ? 0
    : Math.round((resolvedClaimsCount / sentClaims.length) * 100);
  const joinedAt = user?.createdAt ? formatDate(user.createdAt) : 'chưa rõ';
  const activeDays = user?.createdAt
    ? Math.max(1, Math.floor((pageLoadedAt - new Date(user.createdAt).getTime()) / 86400000) + 1)
    : 0;

  return <div className="authenticated-page min-h-screen bg-white">
    <AuthenticatedNavigation />
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] pb-16 pt-5 sm:w-[calc(100%-3rem)]">
      <section className="rounded-[25px] border border-[#1882ac] bg-[#c7dde6] px-5 py-6 sm:px-7" aria-labelledby="profile-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[#34454c]">Trang cá nhân</p>
            <h1 id="profile-title" className="mt-1 break-words text-3xl font-bold leading-tight text-black sm:text-[38px]">{user?.fullName || (loading ? 'Đang tải...' : 'Tài khoản')}</h1>
          </div>
          <p className="shrink-0 pt-1 text-right text-xs text-black sm:text-sm">Ngày tạo tài khoản: {joinedAt}</p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base"><strong>{posts.length}</strong> bài đăng</div>
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base"><strong>{sentClaims.length}</strong> lần trợ giúp</div>
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base" title={`${resolvedClaimsCount}/${sentClaims.length} đơn đã gửi được giải quyết`}><strong>{reputation}%</strong> độ uy tín</div>
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base"><strong>{activeDays}</strong> ngày hoạt động</div>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="my-posts-title">
        <div>
          <h2 id="my-posts-title" className="text-3xl font-bold leading-tight text-black sm:text-[36px]">Bài đăng của tôi</h2>
          <p className="mt-1 text-base text-black sm:text-lg">Theo dõi và quản lý những món đồ bạn đã đăng.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-[25px] border border-[#1882ac] bg-[#e9f3f7] p-3 sm:grid-cols-4" aria-label="Lọc bài đăng">
          {filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`min-h-11 rounded-full border border-[#1882ac] px-3 text-sm font-semibold transition sm:text-base ${filter === item.value ? 'bg-[#287f9f] text-white' : 'bg-white text-black hover:bg-[#f5fbfd]'}`}>{item.label}</button>)}
        </div>

        {error && <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">{error}</p>}
        {loading && <div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="h-80 animate-pulse rounded-[24px] bg-[#e6f0f3]" /><div className="h-80 animate-pulse rounded-[24px] bg-[#e6f0f3]" /></div>}
        {!loading && !error && visiblePosts.length > 0 && <div className="mt-6 grid gap-5 sm:grid-cols-2">{visiblePosts.map((post) => <ProfilePostCard key={post.id} post={post} />)}</div>}
        {!loading && !error && visiblePosts.length === 0 && <div className="mt-6 grid min-h-64 place-items-center rounded-[26px] border border-dashed border-[#9fc5d4] bg-white px-6 text-center"><div><SearchX className="mx-auto h-9 w-9 text-[#70a5b9]" /><h3 className="mt-3 font-semibold text-[#14252c]">Chưa có bài đăng nào</h3><p className="mt-1 text-sm text-slate-500">Không có bài viết phù hợp với trạng thái này.</p></div></div>}
      </section>
    </main>
  </div>;
}
