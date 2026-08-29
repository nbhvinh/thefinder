import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

function formatDateTime(value) {
  if (!value) return 'Chưa cung cấp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export default function HomePostCard({ post, onFound }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const reportRef = useRef(null);

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

  return (
    <article className="relative grid min-h-[316px] grid-cols-1 gap-4 rounded-[32px] border border-[#237596] bg-white p-3 md:grid-cols-[300px_1fr]" aria-labelledby={`post-${post.id}`}>
      <div className="group relative grid min-h-[220px] self-start overflow-hidden rounded-[25px] bg-[#d9d9d9] md:h-[292px]">
        {hasImage ? <img src={imageUrls[currentImageIndex]} onError={() => setImageFailed(true)} alt={`Ảnh ${currentImageIndex + 1} của bài đăng ${post.title}`} className="h-full w-full object-cover" /> : <p className="place-self-center px-6 text-center text-base text-slate-500">Không có hình ảnh đính kèm</p>}
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
        <div className="flex items-start gap-2 pr-8">
          <div className="min-w-0">
            {typeLabel && <span className={`mr-2 inline-block align-[0.2em] rounded-full px-3 py-1 text-sm font-semibold ${typeLabelStyle}`}>{typeLabel}</span>}
            <h2 id={`post-${post.id}`} className="inline break-words text-2xl text-black md:text-[26px]">{post.title}</h2>
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
          <p className="text-base text-black">{post.author || 'Ẩn danh'}</p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-base"><span>Trạng thái:</span><span className="text-[#237596]">{post.status}</span></div>
              <time dateTime={post.createdAt || undefined} className="mt-0.5 block text-xs text-slate-500">{formatDateTime(post.createdAt)}</time>
            </div>
            <button type="button" onClick={() => onFound?.(post)} className="h-9 w-[174px] shrink-0 rounded-[30px] bg-[#237596] text-base text-white">Bạn có tìm thấy?</button>
          </div>
        </div>
      </div>
      <div ref={reportRef} className="absolute right-4 top-4 z-20">
        <button type="button" onClick={() => setIsReportOpen((open) => !open)} aria-label={`Mở menu báo cáo bài ${post.title}`} aria-expanded={isReportOpen} className="block text-[#d60000]"><XCircle size={22} fill="#d60000" color="white" /></button>
        {isReportOpen && <div className="absolute right-0 top-full mt-2 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"><button type="button" className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Báo cáo</button></div>}
      </div>
    </article>
  );
}
