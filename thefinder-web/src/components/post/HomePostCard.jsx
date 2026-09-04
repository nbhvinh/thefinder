import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { reportPost } from '../../api/postApi';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { Link } from 'react-router-dom';

const reportReasons = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'FAKE', label: 'Thông tin giả' },
  { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
  { value: 'OTHER', label: 'Lý do khác' },
];

function errorMessage(error) {
  const data = error.response?.data;
  return typeof data === 'string' ? data : data?.error || 'Không thể gửi báo cáo. Vui lòng thử lại.';
}

function formatDateTime(value) {
  if (!value) return 'Chưa cung cấp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export default function HomePostCard({ post, onFound, claimStatus, isOwner }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDetail, setReportDetail] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const reportRef = useRef(null);
  useBodyScrollLock(Boolean(imagePreview));

  useEffect(() => {
    function closeReport(event) {
      if (!reportRef.current?.contains(event.target)) setIsReportOpen(false);
    }
    document.addEventListener('pointerdown', closeReport);
    return () => document.removeEventListener('pointerdown', closeReport);
  }, []);

  const imageUrls = post.imageUrls ?? [];
  const hasImage = Boolean(imageUrls[currentImageIndex]) && !imageFailed;
  const hasMultipleImages = imageUrls.length > 1;
  const typeLabel = post.type === 'LOST' ? 'Tìm đồ' : post.type === 'FOUND' ? 'Trả đồ' : null;
  const typeLabelStyle = post.type === 'FOUND'
    ? 'border border-[#237596] bg-white text-black'
    : 'border border-[#237596] bg-[#237596] text-white';
  const isResolved = post.status === 'RESOLVED';
  const isClosed = post.status === 'CLOSED';
  const claimButtonLabel = isResolved ? 'RESOLVED' : isClosed ? 'CLOSED' : claimStatus === 'SUBMITTED' ? 'ĐÃ GỬI' : claimStatus === 'PENDING' || claimStatus === 'REVIEWING' ? 'PENDING' : post.type === 'FOUND' ? 'Đây là đồ của bạn?' : 'Bạn có tìm thấy?';
  const claimButtonDisabled = isResolved || isClosed || Boolean(claimStatus) || isOwner;

  function selectImage(index) {
    setImageFailed(false);
    setCurrentImageIndex(index);
  }

  function showPreviousImage() {
    selectImage((currentImageIndex - 1 + imageUrls.length) % imageUrls.length);
  }

  function showNextImage() {
    selectImage((currentImageIndex + 1) % imageUrls.length);
  }

  function closeImagePreview() {
    if (!imagePreview || imagePreview.closing) return;
    setImagePreview((current) => ({ ...current, closing: true }));
    window.setTimeout(() => setImagePreview(null), 300);
  }

  useEffect(() => {
    if (!imagePreview) return undefined;
    const handlePreviewKeys = (event) => {
      if (event.key === 'Escape' && !imagePreview.closing) {
        setImagePreview((current) => ({ ...current, closing: true }));
        window.setTimeout(() => setImagePreview(null), 300);
      }
      if (event.key === 'ArrowLeft' && imageUrls.length > 1) {
        setImageFailed(false);
        setCurrentImageIndex((index) => (index - 1 + imageUrls.length) % imageUrls.length);
      }
      if (event.key === 'ArrowRight' && imageUrls.length > 1) {
        setImageFailed(false);
        setCurrentImageIndex((index) => (index + 1) % imageUrls.length);
      }
    };
    window.addEventListener('keydown', handlePreviewKeys);
    return () => window.removeEventListener('keydown', handlePreviewKeys);
  }, [imagePreview, imageUrls.length]);

  function openImagePreview(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const targetWidth = Math.min(1280, window.innerWidth - 32, (window.innerHeight - 32) * (16 / 9));
    setImagePreview({
      originX: bounds.left + bounds.width / 2 - window.innerWidth / 2,
      originY: bounds.top + bounds.height / 2 - window.innerHeight / 2,
      scale: Math.max(0.08, Math.min(bounds.width / targetWidth, bounds.height / (targetWidth * 9 / 16))),
    });
  }

  async function submitReport(event) {
    event.preventDefault();
    try {
      setReporting(true);
      setReportMessage('');
      await reportPost(post.id, {
        reason: reportReason,
        detail: reportDetail.trim() || null,
      });
      setReported(true);
      setReportMessage('Báo cáo đã được gửi tới quản trị viên.');
      window.dispatchEvent(new Event('thefinder:notifications-changed'));
    } catch (error) {
      setReportMessage(errorMessage(error));
    } finally {
      setReporting(false);
    }
  }

  return (
    <article className="relative flex min-h-[316px] flex-col gap-4 rounded-[32px] border border-[#237596] bg-white p-3 md:grid md:grid-cols-[300px_1fr]" aria-label={`Bài đăng ${post.title}`}>
      <div className="min-w-0 px-2 pr-8 pt-2 md:hidden">
        {typeLabel && <span className={`mr-2 inline-block align-[0.2em] rounded-full px-3 py-1 text-sm font-semibold ${typeLabelStyle}`}>{typeLabel}</span>}
        <h2 className="inline break-words text-2xl text-black">{post.title}</h2>
      </div>
      <div className="group relative grid min-h-[220px] w-full shrink-0 self-start overflow-hidden rounded-[25px] bg-[#d9d9d9] md:h-[292px]">
        {hasImage ? <button type="button" onClick={openImagePreview} aria-label={`Phóng to ảnh ${currentImageIndex + 1} của bài đăng ${post.title}`} className="h-full w-full cursor-zoom-in overflow-hidden"><img src={imageUrls[currentImageIndex]} onError={() => setImageFailed(true)} alt={`Ảnh ${currentImageIndex + 1} của bài đăng ${post.title}`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" /></button> : <p className="place-self-center px-6 text-center text-base text-slate-500">Không có hình ảnh đính kèm</p>}
        {hasMultipleImages && (
          <div className="pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button type="button" onClick={showPreviousImage} aria-label="Xem ảnh trước" className="pointer-events-auto absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/75 text-black shadow-sm transition-colors hover:bg-white"><ChevronLeft size={30} strokeWidth={2.5} /></button>
            <button type="button" onClick={showNextImage} aria-label="Xem ảnh tiếp theo" className="pointer-events-auto absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/75 text-black shadow-sm transition-colors hover:bg-white"><ChevronRight size={30} strokeWidth={2.5} /></button>
            <div className="pointer-events-auto absolute bottom-4 left-1/2 flex max-w-[75%] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-full bg-black/25 px-3 py-2" aria-label={`Ảnh ${currentImageIndex + 1} trên ${imageUrls.length}`}>
              {imageUrls.map((url, index) => <button key={`${url}-${index}`} type="button" onClick={() => selectImage(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={index === currentImageIndex ? 'true' : undefined} className={`h-2.5 w-2.5 rounded-full border border-white transition-colors ${index === currentImageIndex ? 'bg-[#237596]' : 'bg-white/80 hover:bg-white'}`} />)}
            </div>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col px-2 pt-2.5 md:px-0 md:pr-2.5">
        <div className="hidden items-start gap-2 pr-8 md:flex">
          <div className="min-w-0">
            {typeLabel && <span className={`mr-2 inline-block align-[0.2em] rounded-full px-3 py-1 text-sm font-semibold ${typeLabelStyle}`}>{typeLabel}</span>}
            <h2 className="inline break-words text-[26px] text-black">{post.title}</h2>
          </div>
        </div>
        <section className={`mt-2.5 rounded-[21px] bg-[#d9d9d9] p-3.5 transition-all ${isExpanded ? 'min-h-[140px]' : 'h-[140px] overflow-hidden'}`} aria-label="Nội dung bài đăng">
          <p className="text-sm font-medium text-[#1882ac]">#{post.tag || 'Chưa phân loại'}</p>
          <div className={`mt-2 space-y-0.5 text-sm text-black ${isExpanded ? '' : 'line-clamp-4'}`}>
            <p><span className="font-semibold">Mô tả: </span>{post.description || 'Chưa cung cấp'}</p>
            <p><span className="font-semibold">Địa điểm: </span>{post.location || 'Chưa cung cấp'}</p>
            <p><span className="font-semibold">Thời gian: </span>{formatDateTime(post.eventTime)}</p>
            <p><span className="font-semibold">Nếu có thông tin, vui lòng liên hệ tới: </span>{post.contactInfo || 'Chưa cung cấp'}</p>
          </div>
        </section>
        <button type="button" aria-expanded={isExpanded} onClick={() => setIsExpanded((expanded) => !expanded)} className="mt-1 shrink-0 self-end text-[15px] text-[#237596]">{isExpanded ? 'Rút gọn' : 'Xem thêm ...'}</button>
        <div className="mt-auto">
          {post.authorId ? <Link to={`/users/${post.authorId}`} className="text-base font-medium text-black hover:text-[#237596] hover:underline">{post.author || 'Ẩn danh'}</Link> : <p className="text-base text-black">Ẩn danh</p>}
          <div className="mt-1 flex flex-col items-start justify-between gap-4 min-[420px]:flex-row">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-base"><span>Trạng thái:</span><span className="text-[#237596]">{post.status}</span></div>
              <time dateTime={post.createdAt || undefined} className="mt-0.5 block text-xs text-slate-500">{formatDateTime(post.createdAt)}</time>
            </div>
            {!isOwner && <button disabled={claimButtonDisabled} type="button" onClick={() => onFound?.(post)} className={`h-9 w-full shrink-0 rounded-[30px] px-5 text-sm min-[420px]:w-auto min-[420px]:min-w-[174px] min-[420px]:text-base ${isResolved ? 'bg-[#62a56d] text-white' : claimButtonDisabled ? 'border border-[#237596] bg-[#d9d9d9] text-slate-500' : 'bg-[#237596] text-white'}`}>{claimButtonLabel}</button>}
          </div>
        </div>
      </div>
      {!isOwner && <div ref={reportRef} className="absolute right-4 top-4 z-20">
        <button type="button" onClick={() => setIsReportOpen((open) => !open)} aria-label={`Mở menu báo cáo bài ${post.title}`} aria-expanded={isReportOpen} className="block text-[#d60000]"><XCircle size={22} fill="#d60000" color="white" /></button>
        {isReportOpen && <div className="absolute right-0 top-full mt-2 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"><button disabled={reported} type="button" onClick={() => { setIsReportOpen(false); setIsReportFormOpen(true); }} className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:text-slate-400">{reported ? 'Đã báo cáo' : 'Báo cáo'}</button></div>}
      </div>}
      {imagePreview && createPortal(<div className={`image-lightbox-backdrop fixed inset-0 z-[140] grid place-items-center bg-black/40 p-4 ${imagePreview.closing ? 'image-lightbox-closing pointer-events-none' : ''}`} role="dialog" aria-modal="true" aria-label={`Xem ảnh bài đăng ${post.title}`} onClick={closeImagePreview}>
        <section onClick={(event) => event.stopPropagation()} style={{ '--preview-origin-x': `${imagePreview.originX}px`, '--preview-origin-y': `${imagePreview.originY}px`, '--preview-origin-scale': imagePreview.scale }} className="image-lightbox-panel relative aspect-video w-[min(1280px,calc(100vw-2rem),calc((100vh-2rem)*16/9))] overflow-hidden rounded-2xl border border-white/40 bg-slate-600/45 shadow-2xl">
          <img src={imageUrls[currentImageIndex]} alt={`Ảnh ${currentImageIndex + 1} phóng to của bài đăng ${post.title}`} className="h-full w-full object-contain" />
          <button type="button" onClick={closeImagePreview} aria-label="Đóng ảnh phóng to" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white"><XCircle className="h-6 w-6" /></button>
          {hasMultipleImages && <>
            <button type="button" onClick={showPreviousImage} aria-label="Xem ảnh trước" className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow-md hover:bg-white"><ChevronLeft className="h-8 w-8" /></button>
            <button type="button" onClick={showNextImage} aria-label="Xem ảnh tiếp theo" className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow-md hover:bg-white"><ChevronRight className="h-8 w-8" /></button>
            <div className="absolute bottom-4 left-1/2 flex max-w-[80%] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-full bg-black/45 px-4 py-2.5" aria-label={`Ảnh ${currentImageIndex + 1} trên ${imageUrls.length}`}>
              {imageUrls.map((url, index) => <button key={`preview-${url}-${index}`} type="button" onClick={() => selectImage(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={index === currentImageIndex ? 'true' : undefined} className={`h-2.5 w-2.5 rounded-full border border-white ${index === currentImageIndex ? 'bg-[#237596]' : 'bg-white/80'}`} />)}
            </div>
          </>}
        </section>
      </div>, document.body)}
      {isReportFormOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={`report-title-${post.id}`}><form onSubmit={submitReport} className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id={`report-title-${post.id}`} className="text-2xl font-semibold text-black">Báo cáo bài viết</h2><p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.title}</p></div><button type="button" onClick={() => setIsReportFormOpen(false)} aria-label="Đóng" className="text-slate-500 hover:text-red-600"><XCircle /></button></div><label className="mt-5 block text-sm font-medium text-black">Lý do<select value={reportReason} onChange={(event) => setReportReason(event.target.value)} disabled={reported} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-[#237596]">{reportReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select></label><label className="mt-4 block text-sm font-medium text-black">Giải thích thêm (không bắt buộc)<textarea value={reportDetail} onChange={(event) => setReportDetail(event.target.value)} disabled={reported} maxLength={1000} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-[#237596]" /></label>{reportMessage && <p role="status" className={`mt-3 text-sm ${reported ? 'text-emerald-700' : 'text-red-700'}`}>{reportMessage}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsReportFormOpen(false)} className="h-10 rounded-full border border-[#237596] px-5">{reported ? 'Đóng' : 'Hủy'}</button>{!reported && <button disabled={reporting} type="submit" className="h-10 rounded-full bg-red-600 px-5 text-white disabled:opacity-60">{reporting ? 'Đang gửi...' : 'Gửi báo cáo'}</button>}</div></form></div>}
    </article>
  );
}
