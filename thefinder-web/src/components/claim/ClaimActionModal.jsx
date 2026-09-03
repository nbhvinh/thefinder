import { useEffect } from 'react';
import { resolveApiAssetUrl } from '../../config/api';

function formatDate(value) {
  if (!value) return 'Chưa cung cấp';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ClaimActionModal({ dialog, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!dialog) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [busy, dialog, onCancel]);

  if (!dialog) return null;

  const { claim, post, title, description, actionLabel, destructive, showDetails } = dialog;
  const postImage = post?.images?.[0]?.url;

  return <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/35 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="claim-dialog-title" className="my-auto w-full max-w-3xl rounded-[36px] border border-[#237596] bg-white p-6 shadow-2xl sm:p-9">
      <h2 id="claim-dialog-title" className="text-center text-3xl font-semibold text-[#14252c] sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">{description}</p>

      {showDetails && <div className="mt-7 grid gap-5 rounded-[28px] border border-[#9fc5d4] bg-[#f7fbfc] p-4 sm:grid-cols-[180px_1fr] sm:p-5">
        <div className="grid min-h-40 place-items-center overflow-hidden rounded-[22px] bg-[#d9d9d9]">
          {postImage ? <img src={resolveApiAssetUrl(postImage)} alt={post?.title || claim.postTitle} className="h-full w-full object-cover" /> : <span className="px-3 text-center text-sm text-slate-500">Không có ảnh bài đăng</span>}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#287f9f] px-3 py-1 text-sm text-white">{post?.type === 'LOST' ? 'Tìm đồ' : 'Trả đồ'}</span><h3 className="text-xl font-semibold">{post?.title || claim.postTitle}</h3></div>
          <p className="mt-3 text-sm text-[#237596]">#{post?.categoryName || 'Khác'}</p>
          <p className="mt-1 text-sm text-slate-700">{post?.description || 'Không có mô tả bài đăng.'}</p>
        </div>
        <dl className="space-y-4 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
          <div className="rounded-2xl bg-white p-4"><dt className="font-semibold text-[#237596]">Thời gian gặp mặt</dt><dd className="mt-1">{formatDate(claim.meetTime)}</dd></div>
          <div className="rounded-2xl bg-white p-4"><dt className="font-semibold text-[#237596]">Địa điểm</dt><dd className="mt-1 whitespace-pre-wrap">{claim.meetLocation}</dd></div>
          <div className="rounded-2xl bg-white p-4 sm:col-span-2"><dt className="font-semibold text-[#237596]">Thông tin nhận dạng</dt><dd className="mt-1 whitespace-pre-wrap">{claim.description}</dd></div>
        </dl>
      </div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button disabled={busy} type="button" onClick={onCancel} className="h-12 rounded-full border border-[#237596] bg-white text-[#14252c] transition-colors hover:bg-[#eef8fc] disabled:opacity-50">Hủy</button>
        <button disabled={busy} type="button" onClick={onConfirm} className={`h-12 rounded-full text-white transition-opacity disabled:opacity-50 ${destructive ? 'bg-[#fb5353]' : 'bg-[#287f9f]'}`}>{busy ? 'Đang xử lý...' : actionLabel}</button>
      </div>
    </section>
  </div>;
}
