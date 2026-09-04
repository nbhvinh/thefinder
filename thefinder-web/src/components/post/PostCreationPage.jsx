import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, uploadPostImages } from '../../api/postApi';
import { getCategories } from '../../api/categoryApi';
import AuthenticatedNavigation from '../navigation/AuthenticatedNavigation';
import CategorySelect from './CategorySelect';
import ImageUploadField from './ImageUploadField';
import { clearPostDraft, consumePostDraft } from '../../utils/postDraftStore';

function apiError(error) {
  const data = error.response?.data;
  return data?.error || (typeof data === 'string' ? data : 'Không thể đăng bài. Vui lòng thử lại.');
}

export default function PostCreationPage({ type }) {
  const isLost = type === 'LOST';
  const navigate = useNavigate();
  const [initialDraft] = useState(() => consumePostDraft(type));
  const [form, setForm] = useState(() => initialDraft?.form || { title: '', location: '', eventTime: '', contactInfo: '', description: '' });
  const [categoryId, setCategoryId] = useState(() => initialDraft?.categoryId ?? null);
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState(() => initialDraft?.files || []);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [leaveAction, setLeaveAction] = useState(null);
  const previewUrls = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previewUrls.forEach((image) => URL.revokeObjectURL(image.url)), [previewUrls]);
  useEffect(() => { getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const categoryName = categories.find((category) => Number(category.id) === Number(categoryId))?.name || 'Khác';
  const fields = [
    { name: 'title', label: 'Tiêu đề (Tên vật phẩm)', placeholder: isLost ? 'Ví dụ: Ví da màu nâu' : 'Ví dụ: Chùm chìa khóa Honda', type: 'text' },
    { name: 'location', label: 'Địa điểm', placeholder: isLost ? 'Ví dụ: Nhà xe C7' : 'Ví dụ: Cổng Trần Đại Nghĩa', type: 'text' },
    { name: 'eventTime', label: isLost ? 'Thời gian đánh mất' : 'Thời gian tìm thấy', type: 'datetime-local' },
    { name: 'contactInfo', label: isLost ? 'Thông tin liên hệ (nếu có người tìm thấy sẽ liên hệ)' : 'Thông tin liên hệ (nếu có người đánh mất trùng khớp sẽ liên hệ)', placeholder: 'Ví dụ: 0900 000 000', type: 'text' },
  ];

  function openPreview(event) {
    event.preventDefault();
    if (!form.title.trim()) { setMessage('Vui lòng nhập tiêu đề vật phẩm.'); return; }
    setMessage('');
    setPreviewing(true);
  }

  async function submit() {
    try {
      setSubmitting(true);
      const response = await createPost({ type, title: form.title.trim(), categoryId, description: form.description.trim() || undefined, location: form.location.trim() || undefined, eventTime: form.eventTime ? new Date(form.eventTime).toISOString() : undefined, contactInfo: form.contactInfo.trim() || undefined });
      if (files.length) await uploadPostImages(response.data.id, files);
      clearPostDraft();
      navigate(isLost ? '/home/lost' : '/home/found');
    } catch (error) {
      setMessage(apiError(error));
      setPreviewing(false);
    } finally {
      setSubmitting(false);
    }
  }

  const leave = () => { const destination = leaveAction; clearPostDraft(); setLeaveAction(null); if (destination === -1) navigate(-1); else navigate(destination); };

  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main className="relative mx-auto max-w-[1280px] px-4 py-6"><button type="button" onClick={() => setLeaveAction(-1)} className="mb-5 rounded-full border border-[#237596] px-7 py-2">Quay lại</button><section className="mx-auto max-w-[1080px] rounded-[30px] border border-[#237596] bg-white p-5 sm:p-8"><h1 className="text-3xl font-bold text-black">{isLost ? 'Đăng bài mất vật phẩm' : 'Đăng bài hoàn trả đồ'}</h1><div className="mt-7 grid gap-[42px] lg:grid-cols-[508px_1fr]"><form onSubmit={openPreview} className="space-y-[17px]">{fields.map((field) => <label key={field.name} htmlFor={field.name} className="block text-base text-black">{field.label}<input id={field.name} name={field.name} type={field.type} value={form[field.name]} onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))} placeholder={field.placeholder || ''} className="mt-2 h-11 w-full rounded-lg border border-[#d9d9d9] bg-white px-4 text-black outline-none placeholder:text-[#9ca3af] focus:border-[#237596]" /></label>)}<CategorySelect value={categoryId} onChange={setCategoryId} /><label htmlFor="description" className="block text-base text-black">Miêu tả chi tiết<textarea id="description" name="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={isLost ? 'Màu sắc, đặc điểm nhận dạng, vật bên trong...' : 'Màu sắc, đặc điểm nhận dạng, nơi tìm thấy...'} className="mt-2 min-h-20 w-full resize-y rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-black outline-none placeholder:text-[#9ca3af] focus:border-[#237596]" /></label><ImageUploadField files={files} onChange={setFiles} /><div className="flex flex-wrap gap-4 pt-1 sm:gap-6"><button type="button" onClick={() => setLeaveAction('/home')} className="h-11 flex-1 rounded-full border border-[#1882ac] bg-white px-6 text-black">Hủy</button><button disabled={submitting} type="submit" className="h-11 flex-1 rounded-full bg-[#237596] px-6 text-white disabled:opacity-60">Xác nhận</button></div><p role="status" className="text-sm text-red-700">{message}</p></form><div className="grid min-h-[420px] place-items-center rounded-[30px] bg-[#d9d9d9]"><img src={isLost ? '/assets/anima/public-home/lostbd.png' : '/assets/anima/public-home/foundbd.png'} alt="Minh họa vật phẩm" className="h-full w-full rounded-[30px] object-cover" /></div></div></section></main>
    {leaveAction !== null && <div className="fixed inset-0 z-[110] grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-[30px] border border-[#237596] bg-white p-6 text-center shadow-2xl"><h2 className="text-2xl font-semibold">Rời khỏi trang đăng bài?</h2><p className="mt-3 text-slate-600">Mọi thay đổi bạn vừa nhập sẽ không được lưu.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setLeaveAction(null)} className="h-11 rounded-full border border-[#237596]">Tiếp tục chỉnh sửa</button><button type="button" onClick={leave} className="h-11 rounded-full bg-[#fb5353] text-white">Rời khỏi</button></div></section></div>}
    {previewing && <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-black/35 p-4"><section role="dialog" aria-modal="true" className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-[#237596] bg-white p-6 shadow-2xl sm:p-8"><h2 className="text-center text-3xl font-semibold">Xem trước bài viết</h2><article className="mt-6 rounded-[26px] border border-[#9fc5d4] p-5"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#287f9f] px-3 py-1 text-sm text-white">{isLost ? 'Tìm đồ' : 'Trả đồ'}</span><h3 className="text-2xl font-semibold">{form.title.trim()}</h3></div><p className="mt-4 text-[#237596]">#{categoryName}</p><p className="mt-2 whitespace-pre-wrap">{form.description.trim() || 'Không có mô tả.'}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Địa điểm</dt><dd>{form.location.trim() || 'Chưa cung cấp'}</dd></div><div><dt className="font-semibold">Thời gian</dt><dd>{form.eventTime ? new Date(form.eventTime).toLocaleString('vi-VN') : 'Chưa cung cấp'}</dd></div><div className="sm:col-span-2"><dt className="font-semibold">Liên hệ</dt><dd>{form.contactInfo.trim() || 'Chưa cung cấp'}</dd></div></dl>{previewUrls.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{previewUrls.map((image) => <img key={image.url} src={image.url} alt={image.name} className="h-28 w-28 rounded-2xl object-cover" />)}</div>}</article><div className="mt-7 grid gap-4 sm:grid-cols-2"><button disabled={submitting} type="button" onClick={() => setPreviewing(false)} className="h-12 rounded-full border border-[#237596] disabled:opacity-50">Tiếp tục chỉnh sửa</button><button disabled={submitting} type="button" onClick={submit} className="h-12 rounded-full bg-[#287f9f] text-white disabled:opacity-50">{submitting ? 'Đang đăng...' : 'Xác nhận'}</button></div></section></div>}
  </div>;
}
