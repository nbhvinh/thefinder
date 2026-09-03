import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blacklistUser, getBlacklistedUsers, removeUserFromBlacklist, searchBlacklistCandidates } from '../../api/adminApi';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';

export default function AdminBlacklistPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getBlacklistedUsers().then(setBlacklisted).catch((error) => setMessage(error.response?.data?.error || 'Không thể tải blacklist.'));
  }, []);

  useEffect(() => {
    let active = true;
    const normalized = query.trim();
    if (!normalized) return undefined;
    const timer = window.setTimeout(() => {
      searchBlacklistCandidates(normalized).then((data) => { if (active) setSuggestions(Array.isArray(data) ? data.slice(0, 4) : []); }).catch(() => { if (active) setSuggestions([]); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  async function confirmAction() {
    if (!dialog) return;
    const { user, mode } = dialog;
    try {
      setBusy(true);
      setMessage('');
      if (mode === 'add') {
        await blacklistUser(user.id);
        setBlacklisted((current) => [...current, { ...user, blacklisted: true }].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi')));
        setSuggestions((current) => current.filter((item) => item.id !== user.id));
        setQuery('');
      } else {
        await removeUserFromBlacklist(user.id);
        setBlacklisted((current) => current.filter((item) => item.id !== user.id));
      }
      setDialog(null);
    } catch (error) {
      setMessage(error.response?.data?.error || (mode === 'add' ? 'Không thể thêm tài khoản vào blacklist.' : 'Không thể gỡ tài khoản khỏi blacklist.'));
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] py-6"><button type="button" onClick={() => navigate(-1)} className="rounded-full border border-[#237596] px-8 py-2">Quay lại</button><h1 className="mt-8 text-3xl font-semibold sm:text-4xl">Blacklist</h1><section className="mt-7 rounded-[34px] border border-[#237596] bg-white p-5 sm:p-7"><label htmlFor="blacklist-search" className="text-lg font-semibold">Thêm tài khoản vào blacklist</label><input id="blacklist-search" value={query} onChange={(event) => { setQuery(event.target.value); if (!event.target.value.trim()) setSuggestions([]); }} placeholder="Tìm theo tên hoặc email..." autoComplete="off" className="mt-3 h-12 w-full rounded-full border border-[#237596] px-5 outline-none focus:ring-2 focus:ring-[#9fc5d4]" />{query.trim() && <div className="mt-4 grid gap-3">{suggestions.map((user) => <article key={user.id} className="flex items-center gap-4 rounded-[24px] border border-[#9fc5d4] p-4"><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{user.fullName}</h2><p className="truncate text-sm text-slate-500">{user.email}</p></div><button type="button" onClick={() => setDialog({ user, mode: 'add' })} aria-label={`Thêm ${user.fullName} vào blacklist`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fb5353] text-white hover:bg-red-600"><Plus /></button></article>)}{suggestions.length === 0 && <p className="py-4 text-center text-sm text-slate-500">Không tìm thấy tài khoản phù hợp.</p>}</div>}</section>{message && <p role="alert" className="mt-5 text-red-700">{message}</p>}<h2 className="mt-9 text-2xl font-semibold">Tài khoản đã bị blacklist ({blacklisted.length})</h2><section className="mt-5 grid gap-4">{blacklisted.map((user) => <article key={user.id} className="flex items-center gap-4 rounded-[28px] border border-[#237596] p-5"><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{user.fullName}</h3><p className="mt-1 truncate text-sm text-slate-500">{user.email}</p><span className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">BLACKLISTED</span></div><button disabled={busy} type="button" onClick={() => setDialog({ user, mode: 'remove' })} className="h-11 shrink-0 rounded-full border border-[#237596] px-5 font-semibold text-[#237596] hover:bg-[#eef8fc] disabled:opacity-50">Gỡ</button></article>)}{blacklisted.length === 0 && <p className="grid min-h-40 place-items-center text-slate-500">Chưa có tài khoản nào trong blacklist.</p>}</section></main>{dialog && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-xl rounded-[34px] border border-[#237596] bg-white p-7 text-center shadow-2xl"><h2 className="text-3xl font-semibold">{dialog.mode === 'add' ? `Thêm ${dialog.user.fullName} vào blacklist?` : `Gỡ ${dialog.user.fullName} khỏi blacklist?`}</h2><p className="mt-4 text-slate-600">{dialog.mode === 'add' ? 'Tài khoản này sẽ không thể đăng nhập hoặc thực hiện các thao tác được bảo vệ.' : 'Tài khoản này sẽ có thể đăng nhập và sử dụng hệ thống trở lại.'}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><button disabled={busy} type="button" onClick={() => setDialog(null)} className="h-12 rounded-full border border-[#237596] disabled:opacity-50">Hủy</button><button disabled={busy} type="button" onClick={confirmAction} className={`h-12 rounded-full text-white disabled:opacity-50 ${dialog.mode === 'add' ? 'bg-[#fb5353]' : 'bg-[#287f9f]'}`}>{busy ? 'Đang xử lý...' : dialog.mode === 'add' ? 'Thêm' : 'Gỡ khỏi blacklist'}</button></div></section></div>}</div>;
}
