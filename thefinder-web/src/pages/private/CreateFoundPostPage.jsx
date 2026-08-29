import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import { createPost, uploadPostImages } from '../../api/postApi';
import CategorySelect from '../../components/post/CategorySelect';
import ImageUploadField from '../../components/post/ImageUploadField';

const fields = [
  { name: 'title', label: 'Tiêu đề (Tên vật phẩm)', placeholder: 'Ví dụ: Chùm chìa khóa Honda', type: 'text' },
  { name: 'location', label: 'Địa điểm', placeholder: 'Ví dụ: Cổng Trần Đại Nghĩa', type: 'text' },
  { name: 'eventTime', label: 'Thời gian tìm thấy', placeholder: '', type: 'datetime-local' },
  { name: 'contactInfo', label: 'Thông tin liên hệ (nếu có người đánh mất trùng khớp sẽ liên hệ)', placeholder: 'Ví dụ: 0900 000 000', type: 'text' },
];

export default function CreateFoundPostPage() {
  const [form, setForm] = useState({ title: '', location: '', eventTime: '', contactInfo: '', description: '' });
  const [message, setMessage] = useState(''); const [categoryId, setCategoryId] = useState(null); const [files, setFiles] = useState([]); const [submitting, setSubmitting] = useState(false); const navigate = useNavigate();
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => navigate('/home');
  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) { setMessage('Vui lòng nhập tiêu đề vật phẩm.'); return; }
    try { setSubmitting(true); setMessage(''); const response = await createPost({ type: 'FOUND', title: form.title.trim(), categoryId, description: form.description.trim() || undefined, location: form.location.trim() || undefined, eventTime: form.eventTime ? new Date(form.eventTime).toISOString() : undefined, contactInfo: form.contactInfo.trim() || undefined }); if (files.length) await uploadPostImages(response.data.id, files); navigate('/home/found'); } catch (error) { setMessage(error.response?.data || 'Không thể đăng bài. Vui lòng thử lại.'); } finally { setSubmitting(false); }
  }
  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main className="mx-auto max-w-[1280px] px-4 py-6"><section className="mx-auto max-w-[1188px] rounded-[40px] border-2 border-[#237596] bg-white p-8"><h1 className="text-3xl font-bold text-black">Đăng bài hoàn trả đồ</h1><div className="mt-7 grid gap-[42px] lg:grid-cols-[508px_1fr]"><form onSubmit={submit} className="space-y-[15px]">{fields.map((field) => <label key={field.name} htmlFor={field.name} className="block text-base text-black">{field.label}<input id={field.name} name={field.name} type={field.type} value={form[field.name]} onChange={change} placeholder={field.placeholder} className="mt-2 h-[42px] w-full rounded-lg border border-[#d9d9d9] bg-white px-4 text-black outline-none placeholder:text-[#9ca3af] focus:border-[#237596]" /></label>)}<CategorySelect value={categoryId} onChange={setCategoryId} /><label htmlFor="description" className="block text-base text-black">Miêu tả chi tiết<textarea id="description" name="description" value={form.description} onChange={change} placeholder="Màu sắc, đặc điểm nhận dạng, nơi tìm thấy..." className="mt-2 min-h-20 w-full resize rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-black outline-none placeholder:text-[#9ca3af] focus:border-[#237596]" /></label><ImageUploadField files={files} onChange={setFiles} /><div className="flex flex-wrap gap-6 pt-1"><button type="button" onClick={reset} className="h-[41px] w-[185px] rounded-[30px] border border-[#1882ac] bg-white text-black">Hủy</button><button disabled={submitting} type="submit" className="h-[41px] min-w-[299px] rounded-[30px] bg-[#237596] px-6 text-white disabled:opacity-60">{submitting ? 'Đang đăng...' : 'Xác nhận'}</button></div><p role="status" className="text-sm text-red-700">{message}</p></form><div className="grid min-h-[420px] place-items-center rounded-[30px] bg-[#d9d9d9] text-center text-sm text-slate-500"><img src="/assets/anima/public-home/foundbd.png" alt="Minh họa hoàn trả đồ vật" className="h-full w-full rounded-[30px] object-cover" /></div></div></section></main></div>;
}
