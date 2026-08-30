import ClaimStatusBadge from './ClaimStatusBadge';
import { resolveApiAssetUrl } from '../../config/api';

const imageUrl = resolveApiAssetUrl;

function formatDate(value) {
  if (!value) return 'Chưa cung cấp';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function ClaimCard({ claim, post, mode, busy, onReview, onReject, onConfirm, onCancel }) {
  const postImage = post?.images?.[0]?.url;
  const isActive = claim.status === 'SUBMITTED' || claim.status === 'PENDING' || claim.status === 'REVIEWING';

  return <article className="rounded-[34px] border border-[#237596] bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><time className="text-sm text-slate-500">{formatDate(claim.createdAt)}</time><h2 className="mt-3 text-xl font-semibold">{mode === 'received' ? claim.claimantName : claim.postTitle}</h2>{mode === 'received' && <p className="mt-1 text-sm text-[#237596]">Bài viết: {claim.postTitle}</p>}</div>
      <ClaimStatusBadge status={claim.status} />
    </div>
    <dl className="mt-7 space-y-4"><div><dt className="font-semibold">Nội dung nhận dạng</dt><dd className="mt-1 whitespace-pre-wrap">{claim.description}</dd></div><div><dt className="font-semibold">Dàn xếp trao trả</dt><dd className="mt-1">{formatDate(claim.meetTime)}</dd></div><div><dt className="font-semibold">Địa điểm</dt><dd className="mt-1">{claim.meetLocation}</dd></div></dl>
    <p className="mt-6 font-semibold">Ảnh minh chứng</p>
    <div className="mt-3 flex flex-wrap gap-4">{claim.imageUrls?.map((url, index) => <img key={url} src={imageUrl(url)} alt={`Ảnh minh chứng ${index + 1}`} className="h-32 w-32 rounded-3xl bg-[#d9d9d9] object-cover sm:h-36 sm:w-36" />)}</div>
    {post && <section className="mt-8 grid gap-5 rounded-[30px] border border-[#237596] p-3 sm:grid-cols-[42%_1fr]" aria-label={`Bài đăng ${post.title}`}>
      <div className="grid min-h-56 place-items-center overflow-hidden rounded-[24px] bg-[#d9d9d9]">{postImage ? <img src={imageUrl(postImage)} alt={post.title} className="h-full w-full object-cover" /> : <span className="text-slate-500">Không có ảnh</span>}</div>
      <div className="flex min-w-0 flex-col p-2"><div className="flex items-center gap-3"><span className="rounded-full bg-[#287f9f] px-3 py-1 text-sm text-white">{post.type === 'LOST' ? 'Tìm đồ' : 'Trả đồ'}</span><h3 className="truncate text-2xl font-semibold">{post.title}</h3></div><div className="mt-4 rounded-3xl bg-[#d9d9d9] p-4"><p className="text-[#237596]">#{post.categoryName || 'Khác'}</p><p className="mt-2 line-clamp-4">{post.description || 'Không có nội dung chi tiết.'}</p></div><p className="mt-auto pt-4">Tác giả: {post.authorName}</p><p>Trạng thái: <span className="text-[#237596]">{post.status}</span></p></div>
    </section>}
    {mode === 'received' && isActive && <div className="mt-7 flex flex-wrap gap-5"><button disabled={busy} type="button" onClick={() => onReject(claim)} className="h-12 flex-1 rounded-full border border-[#237596] disabled:opacity-50">Bác bỏ đơn</button>{claim.status === 'SUBMITTED' ? <button disabled={busy} type="button" onClick={() => onReview(claim)} className="h-12 flex-1 rounded-full bg-[#287f9f] text-white disabled:bg-[#d9d9d9]">Tôi sẽ kiểm tra</button> : <button disabled={busy} type="button" onClick={() => onConfirm(claim)} className="h-12 flex-1 rounded-full bg-[#fb5353] text-white disabled:opacity-50">Xác nhận đã tìm được (trả lại) đồ</button>}</div>}
    {mode === 'sent' && isActive && <button disabled={busy} type="button" onClick={() => onCancel(claim)} className="mt-7 h-12 w-full rounded-full border border-red-500 text-red-700 disabled:opacity-50">Hủy đơn</button>}
  </article>;
}
