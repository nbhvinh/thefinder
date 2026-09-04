import { useState } from 'react';
import { X } from 'lucide-react';
import CategorySelect from './CategorySelect';
import { updatePost } from '../../api/postApi';

function errorMessage(error) {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.fields) return Object.values(data.fields)[0];
  return data?.error || 'Không thể cập bài viết. Vui lòng thử lại.';
}

export default function EditPostModal({ post, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: post.title || '',
    description: post.description || '',
    location: post.location || '',
    categoryId: post.categoryId ?? null,
    type: post.type || 'LOST',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.categoryId) {
      setMessage('Vui lòng nhập đầy đủ tiêu đề, mô tả, địa điểm và danh mục.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage('');
      const response = await updatePost(post.id, {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
      });
      onUpdated(response.data);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-post-title"><form onSubmit={submit} className="relative my-6 w-full max-w-xl rounded-[30px] bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-5 top-5 text-slate-500 hover:text-red-600"><X className="h-7 w-7" /></button><h2 id="edit-post-title" className="pr-10 text-2xl font-bold text-black">Chỉnh sửa bài viết</h2><p className="mt-1 text-sm text-slate-500">Chỉ có thể chỉnh sửa trong vòng 1 giờ sau khi đăng.</p><div className="mt-6 space-y-4"><label className="block text-sm font-medium">Tiêu đề<input name="title" value={form.title} onChange={change} maxLength={255} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label><label className="block text-sm font-medium">Loại bài đăng<select name="type" value={form.type} onChange={change} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-[#237596]"><option value="LOST">Tìm đồ</option><option value="FOUND">Trả đồ</option><option value="STOLEN">Cảnh báo trộm cắp</option></select></label><CategorySelect value={form.categoryId} onChange={(categoryId) => setForm((current) => ({ ...current, categoryId }))} /><label className="block text-sm font-medium">Địa điểm<input name="location" value={form.location} onChange={change} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[#237596]" /></label><label className="block text-sm font-medium">Mô tả<textarea name="description" value={form.description} onChange={change} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 p-4 outline-none focus:border-[#237596]" /></label></div>{message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="h-11 rounded-full border border-[#237596] px-6">Hủy</button><button disabled={submitting} type="submit" className="h-11 rounded-full bg-[#237596] px-6 text-white disabled:opacity-60">{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></form></div>;
}
