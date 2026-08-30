import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import ImageUploadField from '../../components/post/ImageUploadField';
import { getCurrentUser } from '../../api/authApi';
import { createClaim } from '../../api/claimApi';
import { getPost } from '../../api/postApi';
import { resolveApiAssetUrl } from '../../config/api';

function errorMessage(error) {
  const data = error.response?.data;
  if (data?.fields) return Object.values(data.fields)[0];
  return data?.error || (typeof data === 'string' ? data : 'Không thể gửi đơn. Vui lòng thử lại.');
}

export default function CreateClaimPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [userName, setUserName] = useState('');
  const [form, setForm] = useState({ description: '', meetTime: '', meetLocation: '' });
  const [files, setFiles] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([getPost(postId), getCurrentUser()])
      .then(([postData, userResponse]) => {
        if (postData.status !== 'OPEN' || postData.authorId === userResponse.data.id) {
          navigate('/home', { replace: true });
          return;
        }
        setPost(postData);
        setUserName(userResponse.data.fullName);
      })
      .catch(() => setMessage('Không thể tải dữ liệu.'));
  }, [navigate, postId]);

  function validate() {
    if (form.description.trim().length < 10) return 'Nội dung nhận dạng phải có ít nhất 10 ký tự.';
    if (!form.meetTime || new Date(form.meetTime) <= new Date()) return 'Vui lòng chọn thời gian gặp trong tương lai.';
    if (!form.meetLocation.trim()) return 'Vui lòng nhập địa điểm gặp.';
    if (!files.length) return 'Bạn phải tải lên ít nhất một ảnh minh chứng.';
    if (files.some((file) => file.size > 5 * 1024 * 1024)) return 'Mỗi ảnh không được vượt quá 5MB.';
    return '';
  }

  function openConfirmation(event) {
    event.preventDefault();
    const validationError = validate();
    setMessage(validationError);
    if (!validationError) setConfirming(true);
  }

  async function submit() {
    try {
      setSubmitting(true);
      setMessage('');
      await createClaim(postId, {
        description: form.description.trim(),
        meetTime: form.meetTime,
        meetLocation: form.meetLocation.trim(),
      }, files);
      setConfirming(false);
      setSuccess(true);
      window.setTimeout(() => navigate('/home', { replace: true }), 2000);
    } catch (error) {
      setMessage(errorMessage(error));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  const firstImage = post?.images?.[0]?.url;
  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main className="mx-auto max-w-[1280px] px-4 py-6"><button type="button" onClick={() => navigate(-1)} className="mb-5 rounded-full border border-[#237596] px-7 py-2">Quay lại</button><h1 className="mb-7 text-4xl font-semibold">Xác nhận chủ nhận / gửi món đồ</h1>{message && !post ? <p className="grid min-h-[50vh] place-items-center text-red-700">{message}</p> : post && <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]"><form onSubmit={openConfirmation} className="flex min-h-[620px] flex-col rounded-[30px] border border-[#237596] p-8"><p className="text-sm text-slate-500">Người gửi đơn</p><p className="mt-2 text-lg font-semibold">{userName}</p><label className="mt-6 font-medium">Nội dung nhận dạng<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={2000} className="mt-2 min-h-32 w-full resize-y rounded-3xl border border-[#237596] px-5 py-4 outline-none" placeholder="Mô tả đặc điểm giúp chủ bài xác minh món đồ..." /></label><div className="mt-6 grid gap-4 sm:grid-cols-2"><label>Dàn xếp trao trả<input type="datetime-local" value={form.meetTime} onChange={(event) => setForm({ ...form, meetTime: event.target.value })} className="mt-2 h-12 w-full rounded-full border border-[#237596] px-5" /></label><label>Địa điểm<input value={form.meetLocation} onChange={(event) => setForm({ ...form, meetLocation: event.target.value })} maxLength={500} className="mt-2 h-12 w-full rounded-full border border-[#237596] px-5" /></label></div><div className="mt-6"><ImageUploadField files={files} onChange={setFiles} maxFiles={3} label="Ảnh minh chứng (bắt buộc, tối đa 3 ảnh)" /></div>{message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}<div className="mt-auto flex gap-5 pt-8"><button type="button" onClick={() => navigate(-1)} className="h-12 flex-1 rounded-full border border-[#237596]">Hủy</button><button type="submit" className="h-12 flex-1 rounded-full bg-[#287f9f] text-white">Xác nhận</button></div></form><article className="rounded-[30px] border border-[#237596] p-7"><div className="flex items-center gap-4"><span className="rounded-full bg-[#287f9f] px-4 py-2 text-white">{post.type === 'LOST' ? 'Tìm đồ' : 'Trả đồ'}</span><h2 className="text-3xl font-semibold">{post.title}</h2></div><p className="mt-4">Tác giả: {post.authorName}</p><p>Trạng thái: <span className="text-[#237596]">{post.status}</span></p><div className="mt-5 rounded-3xl bg-[#d9d9d9] p-5"><p className="text-[#237596]">#{post.categoryName || 'Khác'}</p><p className="mt-2">{post.description || 'Không có mô tả.'}</p></div><div className="mt-7 grid min-h-[330px] place-items-center overflow-hidden rounded-3xl bg-[#d9d9d9]">{firstImage ? <img src={resolveApiAssetUrl(firstImage)} alt={post.title} className="h-full w-full object-cover" /> : 'Không có ảnh'}</div></article></div>}</main>{confirming && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 p-4"><section className="w-full max-w-[900px] rounded-[38px] border border-[#237596] bg-white p-8 text-center"><h2 className="text-4xl font-semibold">Xác nhận</h2><p className="mx-auto mt-3 max-w-2xl text-xl">Xác nhận rằng các thông tin điền hoàn toàn chính xác và gửi cho chủ bài viết?</p><div className="mt-10 grid gap-5 sm:grid-cols-2"><button disabled={submitting} type="button" onClick={() => setConfirming(false)} className="h-14 rounded-full border border-[#237596] disabled:bg-slate-200">Tiếp tục sửa</button><button disabled={submitting} type="button" onClick={submit} className="h-14 rounded-full bg-[#287f9f] text-white disabled:bg-[#d9d9d9] disabled:text-slate-500">{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button></div></section></div>}{success && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/20 p-4"><section className="w-full max-w-5xl rounded-[42px] border border-[#237596] bg-white p-12 text-center"><h2 className="text-5xl font-semibold">Gửi thành công</h2><p className="mt-6 text-2xl">Đang về trang chủ...</p></section></div>}</div>;
}
