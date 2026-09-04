import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import ClaimCard from '../../components/claim/ClaimCard';
import ClaimActionModal from '../../components/claim/ClaimActionModal';
import { cancelClaim, confirmClaim, getMyClaims, getReceivedClaims, rejectClaim, reviewClaim } from '../../api/claimApi';
import { getPost } from '../../api/postApi';

function apiError(error) {
  return error.response?.data?.error || 'Không thể tải dữ liệu.';
}

export default function ClaimsListPage({ mode }) {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [postsById, setPostsById] = useState({});
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let active = true;
    const request = mode === 'received' ? getReceivedClaims() : getMyClaims();
    request.then((data) => {
      if (!active) return;
      setMessage('');
      setClaims(data);
      const postIds = [...new Set(data.map((claim) => claim.postId))];
      Promise.all(postIds.map((postId) => getPost(postId).catch(() => null))).then((posts) => {
        if (active) setPostsById(Object.fromEntries(posts.filter(Boolean).map((post) => [post.id, post])));
      });
    }).catch((error) => {
      if (active) setMessage(apiError(error));
    });
    return () => { active = false; };
  }, [mode]);

  async function update(claim, action) {
    try {
      setBusyId(claim.id);
      const updated = await action(claim.id);
      if (updated) setClaims((items) => items.map((item) => item.id === claim.id ? updated : item));
      else setClaims((items) => items.filter((item) => item.id !== claim.id));
    } catch (error) {
      setMessage(apiError(error));
    } finally {
      setBusyId(null);
    }
  }

  function openDialog(claim, action, options) {
    setDialog({ claim, post: postsById[claim.postId], action, ...options });
  }

  async function confirmDialog() {
    if (!dialog) return;
    await update(dialog.claim, dialog.action);
    setDialog(null);
  }

  const emptyMessage = mode === 'received' ? 'Bạn chưa nhận được yêu cầu nào.' : 'Bạn chưa gửi yêu cầu nào.';
  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main className="mx-auto w-[calc(100%-2rem)] max-w-[780px] py-6 sm:w-[calc(100%-3rem)]"><button type="button" onClick={() => navigate(-1)} className="rounded-full border border-[#237596] px-8 py-2">Quay lại</button><h1 className="mt-8 text-3xl font-semibold sm:text-4xl">{mode === 'received' ? 'Danh sách các đơn nhận được' : 'Danh sách các đơn đã gửi'} ({claims.length})</h1>{message && <p className="grid min-h-[55vh] place-items-center text-center text-red-700">{message}</p>}{!message && claims.length === 0 && <p className="grid min-h-[55vh] place-items-center text-center text-slate-500">{emptyMessage}</p>}<section className="mt-8 grid gap-5">{claims.map((claim) => <ClaimCard key={claim.id} claim={claim} post={postsById[claim.postId]} mode={mode} busy={busyId === claim.id} onReview={(item) => openDialog(item, reviewClaim, { title: 'Kiểm tra thông tin trao trả', description: 'Vui lòng kiểm tra lại thông tin món đồ và lịch hẹn trước khi tiếp nhận đơn.', actionLabel: 'Tôi sẽ kiểm tra', showDetails: true })} onReject={(item) => openDialog(item, rejectClaim, { title: 'Bác bỏ đơn?', description: 'Trạng thái đơn sẽ chuyển thành REJECTED và người gửi sẽ được thông báo.', actionLabel: 'Bác bỏ đơn', destructive: true })} onConfirm={(item) => openDialog(item, confirmClaim, { title: 'Xác nhận đã nhận/trả đồ', description: 'Bài viết sẽ được đánh dấu RESOLVED và các đơn còn lại sẽ bị từ chối.', actionLabel: postsById[item.postId]?.type === 'LOST' ? 'Tôi đã nhận được đồ' : 'Tôi đã trả lại đồ', destructive: true, showDetails: true })} onCancel={(item) => openDialog(item, async (id) => { await cancelClaim(id); return null; }, { title: 'Hủy đơn?', description: 'Đơn này sẽ bị xóa và chủ bài viết sẽ được thông báo.', actionLabel: 'Hủy đơn', destructive: true })} />)}</section></main><ClaimActionModal dialog={dialog} busy={dialog ? busyId === dialog.claim.id : false} onCancel={() => setDialog(null)} onConfirm={confirmDialog} /></div>;
}
