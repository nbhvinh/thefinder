import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { approveReport, dismissReport, getPendingReports } from '../../api/adminApi';
import { getPost } from '../../api/postApi';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import { resolveApiAssetUrl } from '../../config/api';

const reasonLabels = { SPAM: 'Spam', FAKE: 'Thông tin giả', INAPPROPRIATE: 'Nội dung không phù hợp', OTHER: 'Khác' };

function formatDate(value) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState({});
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let active = true;
    getPendingReports().then(async (data) => {
      if (!active) return;
      const items = Array.isArray(data) ? data : [];
      setReports(items);
      const postResults = await Promise.allSettled([...new Set(items.map((item) => item.postId))].map(getPost));
      if (active) setPosts(Object.fromEntries(postResults.filter((item) => item.status === 'fulfilled').map((item) => [item.value.id, item.value])));
    }).catch((error) => { if (active) setMessage(error.response?.data?.error || 'Không thể tải các bài viết bị báo cáo.'); });
    return () => { active = false; };
  }, []);

  async function decide() {
    if (!dialog) return;
    try {
      setBusyId(dialog.report.id);
      await dialog.action(dialog.report.id);
      setReports((current) => current.filter((item) => item.id !== dialog.report.id));
      setDialog(null);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Không thể xử lý báo cáo.');
    } finally {
      setBusyId(null);
    }
  }

  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] py-6"><button type="button" onClick={() => navigate(-1)} className="rounded-full border border-[#237596] px-8 py-2">Quay lại</button><h1 className="mt-8 text-3xl font-semibold sm:text-4xl">Các bài viết bị báo cáo ({reports.length})</h1>{message && <p role="alert" className="mt-5 text-red-700">{message}</p>}<section className="mt-8 grid gap-5">{reports.map((report) => { const post = posts[report.postId]; const image = post?.images?.[0]?.url; return <article key={report.id} className="rounded-[34px] border border-[#237596] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><time className="text-sm text-slate-500">{formatDate(report.createdAt)}</time><h2 className="mt-2 text-xl font-semibold">{report.postTitle}</h2><p className="mt-1 text-sm text-[#237596]">Người báo cáo: {report.reporterName}</p></div><span className="rounded-full bg-[#ff8a47] px-4 py-2 font-semibold">{reasonLabels[report.reason] || report.reason}</span></div><div className="mt-6 grid gap-5 rounded-[28px] bg-[#f3f5f6] p-4 sm:grid-cols-[180px_1fr]">{image ? <img src={resolveApiAssetUrl(image)} alt={report.postTitle} className="h-40 w-full rounded-[22px] object-cover" /> : <div className="grid h-40 place-items-center rounded-[22px] bg-[#d9d9d9] text-sm text-slate-500">Không có ảnh</div>}<div><p className="font-semibold">Nội dung bài viết</p><p className="mt-2 text-sm text-slate-700">{post?.description || 'Không có mô tả.'}</p><p className="mt-4 font-semibold">Chi tiết báo cáo</p><p className="mt-1 whitespace-pre-wrap text-sm">{report.detail || 'Không cung cấp.'}</p></div></div><div className="mt-7 flex flex-wrap gap-4"><button disabled={busyId === report.id} type="button" onClick={() => setDialog({ report, action: dismissReport, title: 'Không duyệt báo cáo?', text: 'Báo cáo sẽ được đóng và bài viết vẫn hiển thị.', label: 'Không duyệt' })} className="h-12 flex-1 rounded-full border border-[#237596] disabled:opacity-50">Không duyệt</button><button disabled={busyId === report.id} type="button" onClick={() => setDialog({ report, action: approveReport, title: 'Duyệt và ẩn bài viết?', text: 'Bài viết sẽ bị ẩn và chủ bài viết sẽ nhận được thông báo.', label: 'Duyệt & ẩn bài', destructive: true })} className="h-12 flex-1 rounded-full bg-[#fb5353] text-white disabled:opacity-50">Duyệt & ẩn bài</button></div></article>; })}</section>{!message && reports.length === 0 && <p className="grid min-h-[45vh] place-items-center text-slate-500">Không còn báo cáo nào chờ duyệt.</p>}</main>{dialog && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-xl rounded-[34px] border border-[#237596] bg-white p-7 text-center shadow-2xl"><h2 className="text-3xl font-semibold">{dialog.title}</h2><p className="mt-4 text-slate-600">{dialog.text}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><button disabled={busyId !== null} type="button" onClick={() => setDialog(null)} className="h-12 rounded-full border border-[#237596]">Hủy</button><button disabled={busyId !== null} type="button" onClick={decide} className={`h-12 rounded-full text-white disabled:opacity-50 ${dialog.destructive ? 'bg-[#fb5353]' : 'bg-[#287f9f]'}`}>{busyId ? 'Đang xử lý...' : dialog.label}</button></div></section></div>}</div>;
}
