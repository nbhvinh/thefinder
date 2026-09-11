import { Bell, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../../api/notificationApi';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

function notificationLink(notification) {
  if (notification.type === 'POST_HIDDEN') return '/profile';
  if (notification.type === 'CLAIM_RECEIVED' || notification.type === 'CLAIM_CANCELLED') return '/claims/received';
  if (notification.type?.startsWith('CLAIM_')) return '/claims/sent';
  return '/home';
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const rootRef = useRef(null);
  const dialogRef = useRef(null);
  useBodyScrollLock(showAll);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadNotifications, 0);
    const intervalId = window.setInterval(loadNotifications, 30000);
    const refreshOnFocus = () => loadNotifications();
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('thefinder:notifications-changed', refreshOnFocus);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('thefinder:notifications-changed', refreshOnFocus);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function close(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => {
    if (!showAll) return undefined;
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') setShowAll(false);
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button, a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [showAll]);

  function togglePanel() {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setOpen(false);
      setShowAll(true);
      loadNotifications();
      return;
    }
    setOpen((value) => !value);
    if (!open) loadNotifications();
  }

  function read(notification) {
    if (!notification.read) {
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read: true } : item
      )));
      markNotificationRead(notification.id).catch(() => loadNotifications());
    }
    setOpen(false);
    setShowAll(false);
  }

  const unreadCount = notifications.filter((item) => !item.read).length;
  const preview = notifications.slice(0, 3);
  const renderNotification = (item, large = false) => (
    <Link
      key={item.id}
      to={notificationLink(item)}
      onClick={() => read(item)}
      className={`block break-words border border-transparent ${large ? 'rounded-3xl p-5 text-lg' : 'mb-2 rounded-xl p-3 text-sm last:mb-0'} ${item.read ? 'bg-[#eceff1] text-slate-600' : 'border-[#9fc5d4] bg-[#e6f3f8] text-black'}`}
    >
      <span>{item.message}</span>
      <span className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
        {!item.read && <span className="font-semibold text-[#237596]">Chưa đọc</span>}
      </span>
    </Link>
  );

  return <div ref={rootRef} className="relative">
    <button type="button" onClick={togglePanel} aria-expanded={open || showAll} className="sidebar-action w-full"><Bell /><span>Thông báo</span>{unreadCount > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
    {open && <div className="absolute left-full top-0 z-[70] ml-2 max-h-[calc(100vh-2rem)] w-[calc(100vw-292px)] max-w-[360px] overflow-auto rounded-2xl border border-[#237596] bg-white p-3 shadow-xl lg:ml-3 lg:w-[360px]">
      {preview.length ? preview.map((item) => renderNotification(item)) : <p className="p-4 text-center text-sm text-slate-500">{loadFailed ? 'Không thể tải thông báo.' : 'Bạn chưa có thông báo nào.'}</p>}
      {notifications.length > 3 && <button type="button" onClick={() => { setOpen(false); setShowAll(true); }} className="mt-2 w-full py-2 text-sm text-[#237596]">Xem thêm...</button>}
    </div>}
    {showAll && createPortal(
      <div
        className="fixed inset-0 z-[120] grid place-items-center bg-black/30 p-3 sm:p-4"
        onClick={(event) => { if (event.target === event.currentTarget) setShowAll(false); }}
      >
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="all-notifications-title" className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#237596] bg-white shadow-2xl sm:max-h-[75dvh]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 id="all-notifications-title" className="text-xl font-semibold sm:text-2xl">Thông báo của bạn</h2>
            <button type="button" onClick={() => setShowAll(false)} aria-label="Đóng thông báo" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-red-600 hover:bg-red-50"><X className="h-6 w-6" /></button>
          </div>
          <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {notifications.length ? notifications.map((item) => renderNotification(item)) : <p className="py-8 text-center text-sm text-slate-500">{loadFailed ? 'Không thể tải thông báo.' : 'Bạn chưa có thông báo nào.'}</p>}
          </div>
        </section>
      </div>, document.body)}
  </div>;
}
