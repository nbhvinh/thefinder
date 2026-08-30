import { Bell, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyClaims, getReceivedClaims } from '../../api/claimApi';

function notificationFor(claim, side) {
  if (side === 'received') {
    const messages = {
      SUBMITTED: `Bạn nhận được một đơn mới cho bài viết “${claim.postTitle}”.`,
      PENDING: `Bạn đã nhận kiểm tra một đơn cho bài viết “${claim.postTitle}”.`,
      REVIEWING: `Bạn đã nhận kiểm tra một đơn cho bài viết “${claim.postTitle}”.`,
      CONFIRMED: `Bạn đã hoàn tất trao trả món đồ trong bài viết “${claim.postTitle}”.`,
      REJECTED: `Một đơn cho bài viết “${claim.postTitle}” đã bị từ chối.`,
    };
    return { id: `received-${claim.id}-${claim.status}`, message: messages[claim.status], to: '/claims/received', action: 'Xem các đơn', createdAt: claim.createdAt };
  }
  const messages = {
    SUBMITTED: 'Đã gửi đơn. Chủ bài viết sẽ thấy yêu cầu của bạn, hãy chờ liên lạc.',
    PENDING: `Chủ bài viết đang kiểm tra đơn của bạn cho bài “${claim.postTitle}”.`,
    REVIEWING: `Chủ bài viết đang kiểm tra đơn của bạn cho bài “${claim.postTitle}”.`,
    CONFIRMED: `Đơn của bạn cho bài viết “${claim.postTitle}” đã được xác nhận.`,
    REJECTED: `Đơn của bạn cho bài viết “${claim.postTitle}” đã bị từ chối.`,
  };
  return { id: `sent-${claim.id}-${claim.status}`, message: messages[claim.status], to: '/claims/sent', action: 'Xem bài viết', createdAt: claim.createdAt };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([getMyClaims(), getReceivedClaims()]).then(([sent, received]) => {
      if (!active) return;
      setNotifications([
        ...sent.map((claim) => notificationFor(claim, 'sent')),
        ...received.map((claim) => notificationFor(claim, 'received')),
      ].filter((item) => item.message).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function close(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const list = notifications.slice(0, 3);
  return <div ref={rootRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="sidebar-action w-full"><Bell /><span>Thông báo</span>{notifications.length > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{notifications.length}</span>}</button>
    {open && <div className="absolute left-0 top-full z-[70] mt-2 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#237596] bg-white p-3 shadow-xl lg:left-full lg:top-0 lg:ml-3 lg:mt-0">
      {list.length ? list.map((item) => <Link key={item.id} to={item.to} onClick={() => setOpen(false)} className="mb-2 block rounded-xl bg-[#e5e5e5] p-3 text-sm last:mb-0"><span>{item.message}</span><span className="mt-1 block text-[#237596]">{item.action}</span></Link>) : <p className="p-4 text-center text-sm text-slate-500">Bạn chưa có thông báo nào.</p>}
      {notifications.length > 3 && <button type="button" onClick={() => { setOpen(false); setShowAll(true); }} className="mt-2 w-full py-2 text-sm text-[#237596]">Xem thêm...</button>}
    </div>}
    {showAll && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/30 p-4"><section className="relative max-h-[82vh] w-full max-w-4xl overflow-auto rounded-[38px] border border-[#237596] bg-white p-7 sm:p-10"><button type="button" onClick={() => setShowAll(false)} aria-label="Đóng thông báo" className="absolute right-5 top-5 text-red-600"><X className="h-9 w-9" /></button><h2 className="pr-12 text-3xl font-semibold sm:text-4xl">Thông báo của bạn</h2><div className="mt-8 space-y-4">{notifications.map((item) => <Link key={item.id} to={item.to} onClick={() => setShowAll(false)} className="block rounded-3xl bg-[#d9d9d9] p-5 text-lg"><span>{item.message}</span><span className="mt-2 block text-[#237596]">{item.action}</span></Link>)}</div></section></div>}
  </div>;
}
