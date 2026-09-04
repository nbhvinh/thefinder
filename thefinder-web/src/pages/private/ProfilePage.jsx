import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Ellipsis, ExternalLink, MapPin, MessageCircle, Pencil, Phone, SearchX, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import { getCurrentUser } from '../../api/authApi';
import { getMyClaims } from '../../api/claimApi';
import { deletePost, getMyPosts, getPost, getPosts } from '../../api/postApi';
import { resolveApiAssetUrl } from '../../config/api';
import EditPostModal from '../../components/post/EditPostModal';
import { getUserPosts, getUserProfile } from '../../api/userApi';

const filters = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang hoạt động' },
  { value: 'RESOLVED', label: 'Thành công' },
  { value: 'CLAIMED', label: 'Đã điền đơn' },
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
  return resolveApiAssetUrl(url);
}

function ProfilePostCard({ post, manageable = true, onEdit, onDelete }) {
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
      {manageable && <div ref={menuRef} className="absolute right-3 top-3 z-10">
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={`Tùy chọn bài viết ${post.title}`} aria-expanded={menuOpen} className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#18323d] shadow-md transition hover:bg-[#eef8fc]"><Ellipsis className="h-5 w-5" /></button>
        {menuOpen && <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-[#bdd7e2] bg-white p-1.5 text-sm shadow-xl">
          <button type="button" onClick={() => { setMenuOpen(false); onEdit(post); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[#18323d] hover:bg-[#eef8fc]"><Pencil className="h-4 w-4 text-[#237596]" />Chỉnh sửa bài viết</button>
          <button type="button" onClick={() => { setMenuOpen(false); onDelete(post); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />Xóa bài viết</button>
        </div>}
      </div>}
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
  const { userId: routeUserId } = useParams();
  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(!routeUserId);
  const [posts, setPosts] = useState([]);
  const [sentClaims, setSentClaims] = useState([]);
  const [claimedPosts, setClaimedPosts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const userResponse = await getCurrentUser();
        if (!active) return;
        const currentUser = userResponse.data;
        const viewingOwn = !routeUserId || Number(routeUserId) === Number(currentUser.id);
        const targetUser = viewingOwn ? currentUser : await getUserProfile(routeUserId);
        if (!active) return;
        setUser(targetUser);
        setIsOwnProfile(viewingOwn);
        setFilter('ALL');
        const postsRequest = viewingOwn ? getMyPosts().catch(async () => {
          const allPosts = await getPosts({ size: 1000 });
          return allPosts.filter((post) => Number(post.authorId) === Number(currentUser.id));
        }) : getUserPosts(routeUserId);
        const [myPosts, myClaims] = await Promise.all([
          postsRequest,
          viewingOwn ? getMyClaims().catch(() => []) : Promise.resolve([]),
        ]);
        const normalizedClaims = Array.isArray(myClaims) ? myClaims : [];
        const claimedPostIds = viewingOwn ? [...new Set(normalizedClaims.map((claim) => claim.postId).filter(Boolean))] : [];
        const claimedPostResults = await Promise.allSettled(claimedPostIds.map((postId) => getPost(postId)));
        const claimedPostList = claimedPostResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)
          .filter((post) => Number(post.authorId) !== Number(currentUser.id));
        if (active) {
          setPosts(Array.isArray(myPosts) ? myPosts : []);
          setSentClaims(normalizedClaims);
          setClaimedPosts(claimedPostList);
        }
      } catch {
        if (active) setError('Không thể tải trang cá nhân. Hãy thử lại sau.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [routeUserId]);

  const visiblePosts = useMemo(() => {
    if (filter === 'CLAIMED') return claimedPosts;
    if (filter === 'ALL') return posts;
    return posts.filter((post) => post.status === filter);
  }, [claimedPosts, filter, posts]);
  const resolvedClaimsCount = sentClaims.filter((claim) => claim.status === 'CONFIRMED').length;
  const reputation = !isOwnProfile ? (user?.reputation || 0) : sentClaims.length === 0
    ? 0
    : Math.round((resolvedClaimsCount / sentClaims.length) * 100);
  const helpCount = isOwnProfile ? sentClaims.length : (user?.helpCount || 0);
  const joinedAt = user?.createdAt ? formatDate(user.createdAt) : 'chưa rõ';
  const activeDays = user?.createdAt
    ? Math.max(1, Math.floor((pageLoadedAt - new Date(user.createdAt).getTime()) / 86400000) + 1)
    : 0;

  function handleUpdated(updatedPost) {
    setPosts((current) => current.map((post) => post.id === updatedPost.id ? updatedPost : post));
    setEditingPost(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await deletePost(deleteTarget.id);
      setPosts((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (deleteError) {
      const data = deleteError.response?.data;
      setError(typeof data === 'string' ? data : data?.error || 'Không thể xóa bài viết. Vui lòng thử lại.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return <div className="authenticated-page min-h-screen bg-white">
    <AuthenticatedNavigation />
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] pb-16 pt-5 sm:w-[calc(100%-3rem)]">
      <section className="rounded-[25px] border border-[#1882ac] bg-[#c7dde6] px-5 py-6 sm:px-7" aria-labelledby="profile-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[#34454c]">Trang cá nhân</p>
            <h1 id="profile-title" className="mt-1 break-words text-3xl font-bold leading-tight text-black sm:text-[38px]">{user?.fullName || (loading ? 'Đang tải...' : 'Tài khoản')}</h1>
          </div>
          <p className="pt-1 text-xs text-black sm:shrink-0 sm:text-right sm:text-sm">Ngày tạo tài khoản: {joinedAt}</p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base"><strong>{posts.length}</strong> bài đăng</div>
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base"><strong>{helpCount}</strong> lần trợ giúp</div>
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base" title={`${resolvedClaimsCount}/${sentClaims.length} đơn đã gửi được giải quyết`}><strong>{reputation}%</strong> độ uy tín</div>
          <div className="rounded-full bg-white px-3 py-3 text-center text-sm sm:text-base"><strong>{activeDays}</strong> ngày hoạt động</div>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="my-posts-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="my-posts-title" className="text-3xl font-bold leading-tight text-black sm:text-[36px]">{isOwnProfile ? 'Bài đăng của tôi' : `Bài đăng của ${user?.fullName || 'người dùng'}`}</h2>
          <p className="mt-1 text-base text-black sm:text-lg">{isOwnProfile ? 'Theo dõi và quản lý những món đồ bạn đã đăng.' : 'Các bài đăng công khai của người dùng này.'}</p></div>
          {!isOwnProfile && <button type="button" onClick={() => setContactOpen(true)} className="order-first h-11 shrink-0 rounded-full bg-[#237596] px-7 font-semibold text-white sm:order-none">Liên hệ</button>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-[25px] border border-[#1882ac] bg-[#e9f3f7] p-3 sm:grid-cols-4" aria-label="Lọc bài đăng">
          {filters.filter((item) => isOwnProfile || item.value !== 'CLAIMED').map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`min-h-11 rounded-full border border-[#1882ac] px-3 text-sm font-semibold transition sm:text-base ${filter === item.value ? 'bg-[#287f9f] text-white' : 'bg-white text-black hover:bg-[#f5fbfd]'}`}>{item.label}</button>)}
        </div>

        {error && <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">{error}</p>}
        {loading && <div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="h-80 animate-pulse rounded-[24px] bg-[#e6f0f3]" /><div className="h-80 animate-pulse rounded-[24px] bg-[#e6f0f3]" /></div>}
        {!loading && !error && visiblePosts.length > 0 && <div className="mt-6 grid gap-5 sm:grid-cols-2">{visiblePosts.map((post) => <ProfilePostCard key={post.id} post={post} manageable={isOwnProfile && filter !== 'CLAIMED'} onEdit={setEditingPost} onDelete={setDeleteTarget} />)}</div>}
        {!loading && !error && visiblePosts.length === 0 && <div className="mt-6 grid min-h-64 place-items-center rounded-[26px] border border-dashed border-[#9fc5d4] bg-white px-6 text-center"><div><SearchX className="mx-auto h-9 w-9 text-[#70a5b9]" /><h3 className="mt-3 font-semibold text-[#14252c]">{filter === 'CLAIMED' ? 'Chưa điền đơn nào' : 'Chưa có bài đăng nào'}</h3><p className="mt-1 text-sm text-slate-500">{filter === 'CLAIMED' ? 'Các bài viết bạn đã gửi đơn sẽ xuất hiện tại đây.' : 'Không có bài viết phù hợp với trạng thái này.'}</p></div></div>}
      </section>
    </main>
    {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onUpdated={handleUpdated} />}
    {contactOpen && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/35 p-4" onClick={() => setContactOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="profile-contact-title" onClick={(event) => event.stopPropagation()} className="relative w-full max-w-md rounded-[30px] border border-[#237596] bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setContactOpen(false)} aria-label="Đóng" className="absolute right-5 top-5 text-slate-500"><X /></button><h2 id="profile-contact-title" className="pr-10 text-2xl font-semibold">Liên hệ {user?.fullName}</h2><div className="mt-6 space-y-3">{user?.phone && <a href={`tel:${user.phone}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-[#eef8fc]"><Phone className="text-[#237596]" /><span>{user.phone}</span></a>}{user?.messengerUrl && <a href={user.messengerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-[#eef8fc]"><MessageCircle className="text-[#237596]" /><span className="min-w-0 flex-1 truncate">Messenger</span><ExternalLink className="h-4 w-4" /></a>}{user?.zaloUrl && <a href={user.zaloUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-[#eef8fc]"><MessageCircle className="text-[#237596]" /><span className="min-w-0 flex-1 truncate">Zalo</span><ExternalLink className="h-4 w-4" /></a>}{!user?.phone && !user?.messengerUrl && !user?.zaloUrl && <p className="rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-500">Người dùng chưa công khai thông tin liên hệ.</p>}</div></section></div>}
    {deleteTarget && <div className="fixed inset-0 z-[110] grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-post-title" className="w-full max-w-md rounded-[30px] border border-[#237596] bg-white p-6 text-center shadow-2xl sm:p-8"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600"><Trash2 className="h-7 w-7" /></div><h2 id="delete-post-title" className="mt-4 text-2xl font-semibold text-[#14252c]">Xóa bài viết?</h2><p className="mt-3 text-slate-600">Bạn có chắc muốn xóa vĩnh viễn bài viết <strong className="text-[#14252c]">“{deleteTarget.title}”</strong>?</p><p className="mt-2 text-sm text-red-700">Ảnh và các đơn liên quan cũng sẽ bị xóa. Thao tác này không thể hoàn tác.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button disabled={deleting} type="button" onClick={() => setDeleteTarget(null)} className="h-11 rounded-full border border-[#237596] bg-white disabled:opacity-50">Hủy</button><button disabled={deleting} type="button" onClick={handleDelete} className="h-11 rounded-full bg-[#fb5353] text-white disabled:opacity-50">{deleting ? 'Đang xóa...' : 'Xóa bài viết'}</button></div></section></div>}
  </div>;
}
