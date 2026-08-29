import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const actions = [
  { label: 'Đăng bài bị mất đồ', to: '/posts/create/lost' },
  { label: 'Đăng bài trả lại đồ', to: '/posts/create/found' },
  { label: 'Báo cáo trộm cắp', disabled: true },
];

export default function CreatePostMenu({ isAuthenticated = false, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function closeMenu(event) {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className={compact ? 'absolute inset-0' : 'relative'}>
      <button
        type="button"
        aria-label="Mở menu đăng bài"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className={compact ? 'absolute inset-0 h-full w-full opacity-0' : 'grid h-10 w-10 place-items-center rounded-full bg-[#237596] text-white transition-colors hover:bg-[#185d79]'}
      >
        {!compact && <Plus className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} strokeWidth={2.5} />}
      </button>

      {isOpen && (
        <div role="menu" className={`absolute z-50 w-60 rounded-xl border border-[#1882ac] bg-white p-2 shadow-lg ${compact ? 'left-0 top-full mt-2 lg:left-full lg:top-0 lg:ml-3 lg:mt-0' : 'right-0 top-full mt-2'}`}>
          {actions.map((action) => action.disabled ? (
            <button key={action.label} type="button" role="menuitem" disabled className="block w-full cursor-not-allowed rounded-lg px-4 py-2.5 text-left text-sm text-black/40">
              {action.label}
            </button>
          ) : (
            <Link
              key={action.label}
              role="menuitem"
              to={isAuthenticated ? action.to : '/sign-in'}
              state={isAuthenticated ? undefined : { from: action.to }}
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm text-black hover:bg-[#eef8fc] hover:text-[#237596]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
