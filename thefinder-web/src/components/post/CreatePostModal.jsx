import { useEffect, useMemo, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPost, uploadPostImages } from '../../api/postApi';
import { getCategories } from '../../api/categoryApi';
import { savePostDraft } from '../../utils/postDraftStore';
import CategorySelect from './CategorySelect';
import ImageUploadField from './ImageUploadField';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const emptyForm = { title: '', location: '', eventTime: '', contactInfo: '', description: '' };

function apiError(error) {
  const data = error.response?.data;
  return data?.error || (typeof data === 'string' ? data : 'Không thể đăng bài. Vui lòng thử lại.');
}

export default function CreatePostModal({ onClose }) {
  const navigate = useNavigate();
  const [type, setType] = useState('LOST');
  const [form, setForm] = useState(emptyForm);
  const [categoryId, setCategoryId] = useState(null);
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const previewUrls = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);
  const isLost = type === 'LOST';
  useBodyScrollLock(true);

  useEffect(() => () => previewUrls.forEach((image) => URL.revokeObjectURL(image.url)), [previewUrls]);
  useEffect(() => { getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const categoryName = categories.find((category) => Number(category.id) === Number(categoryId))?.name || 'Khác';
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  function openPreview(event) {
    event.preventDefault();
    if (!form.title.trim()) { setMessage('Vui lòng nhập tiêu đề vật phẩm.'); return; }
    setMessage('');
    setPreviewing(true);
  }

  function expandEditor() {
    savePostDraft({ type, form, categoryId, files });
    navigate(type === 'LOST' ? '/posts/create/lost' : '/posts/create/found');
  }

  async function submit() {
    try {
      setSubmitting(true);
      const response = await createPost({ type, title: form.title.trim(), categoryId, description: form.description.trim() || undefined, location: form.location.trim() || undefined, eventTime: form.eventTime ? new Date(form.eventTime).toISOString() : undefined, contactInfo: form.contactInfo.trim() || undefined });
      if (files.length) await uploadPostImages(response.data.id, files);
      navigate(type === 'LOST' ? '/home/lost' : '/home/found');
    } catch (error) {
      setMessage(apiError(error));
      setPreviewing(false);
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-post-modal-title">
      <form onSubmit={openPreview} className="relative my-6 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={() => setConfirmingCancel(true)} aria-label="Đóng" className="absolute right-5 top-5 text-slate-500 hover:text-red-600"><X className="h-7 w-7" /></button>
        <h2 id="create-post-modal-title" className="pr-10 text-2xl font-bold text-black">Tạo bài viết mới</h2>
        <p className="mt-1 text-sm text-slate-500">Chia sẻ thông tin để cộng đồng có thể giúp bạn.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Tiêu đề<input name="title" value={form.title} onChange={change} maxLength={255} placeholder={isLost ? 'Ví dụ: Ví da màu nâu' : 'Ví dụ: Chùm chìa khóa Honda'} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
          <label className="block text-sm font-medium">Loại bài đăng<select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-[#237596]"><option value="LOST">Tìm đồ</option><option value="FOUND">Trả đồ</option></select></label>
          <CategorySelect value={categoryId} onChange={setCategoryId} />
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Địa điểm<input name="location" value={form.location} onChange={change} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label><label className="block text-sm font-medium">Thời gian<input name="eventTime" type="datetime-local" value={form.eventTime} onChange={change} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label></div>
          <label className="block text-sm font-medium">Thông tin liên hệ<input name="contactInfo" value={form.contactInfo} onChange={change} maxLength={255} placeholder="Ví dụ: 0900 000 000" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label>
          <label className="block text-sm font-medium">Mô tả<textarea name="description" value={form.description} onChange={change} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-4 outline-none focus:border-[#237596]" /></label>
          <ImageUploadField files={files} onChange={setFiles} />
        </div>
        {message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={expandEditor} aria-label="Mở rộng sang trang soạn bài" className="group flex h-11 w-11 shrink-0 items-center overflow-hidden rounded-full border border-[#237596] px-3 text-[#237596] transition-[width,background-color] duration-300 ease-out hover:w-[116px] hover:bg-[#eef8fc] focus-visible:w-[116px] focus-visible:bg-[#eef8fc]"><Maximize2 className="h-5 w-5 shrink-0" /><span className="ml-0 max-w-0 translate-x-2 whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-20 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-20 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">Mở rộng</span></button><div className="ml-auto flex gap-3"><button type="button" onClick={() => setConfirmingCancel(true)} className="h-11 rounded-full border border-[#237596] px-6">Hủy</button><button disabled={submitting} type="submit" className="h-11 rounded-full bg-[#237596] px-6 text-white disabled:opacity-60">Xác nhận</button></div></div>
      </form>
    </div>

    {confirmingCancel && <div className="fixed inset-0 z-[110] grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-[30px] border border-[#237596] bg-white p-6 text-center shadow-2xl"><h2 className="text-2xl font-semibold">Rời khỏi phần đăng bài?</h2><p className="mt-3 text-slate-600">Mọi thay đổi bạn vừa nhập sẽ không được lưu.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setConfirmingCancel(false)} className="h-11 rounded-full border border-[#237596]">Tiếp tục chỉnh sửa</button><button type="button" onClick={onClose} className="h-11 rounded-full bg-[#fb5353] text-white">Rời khỏi</button></div></section></div>}

    {previewing && <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-black/35 p-4"><section role="dialog" aria-modal="true" className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-[#237596] bg-white p-6 shadow-2xl sm:p-8"><h2 className="text-center text-3xl font-semibold">Xem trước bài viết</h2><article className="mt-6 rounded-[26px] border border-[#9fc5d4] p-5"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#287f9f] px-3 py-1 text-sm text-white">{isLost ? 'Tìm đồ' : 'Trả đồ'}</span><h3 className="text-2xl font-semibold">{form.title.trim()}</h3></div><p className="mt-4 text-[#237596]">#{categoryName}</p><p className="mt-2 whitespace-pre-wrap">{form.description.trim() || 'Không có mô tả.'}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Địa điểm</dt><dd>{form.location.trim() || 'Chưa cung cấp'}</dd></div><div><dt className="font-semibold">Thời gian</dt><dd>{form.eventTime ? new Date(form.eventTime).toLocaleString('vi-VN') : 'Chưa cung cấp'}</dd></div><div className="sm:col-span-2"><dt className="font-semibold">Liên hệ</dt><dd>{form.contactInfo.trim() || 'Chưa cung cấp'}</dd></div></dl>{previewUrls.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{previewUrls.map((image) => <img key={image.url} src={image.url} alt={image.name} className="h-28 w-28 rounded-2xl object-cover" />)}</div>}</article><div className="mt-7 grid gap-4 sm:grid-cols-2"><button disabled={submitting} type="button" onClick={() => setPreviewing(false)} className="h-12 rounded-full border border-[#237596] disabled:opacity-50">Tiếp tục chỉnh sửa</button><button disabled={submitting} type="button" onClick={submit} className="h-12 rounded-full bg-[#287f9f] text-white disabled:opacity-50">{submitting ? 'Đang đăng...' : 'Xác nhận'}</button></div></section></div>}
  </>;
}
