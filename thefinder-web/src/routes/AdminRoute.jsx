import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../api/authApi';

export default function AdminRoute() {
  const [state, setState] = useState('loading');

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((response) => {
        if (active) setState(response.data.role === 'ADMIN' ? 'admin' : 'forbidden');
      })
      .catch(() => { if (active) setState('forbidden'); });
    return () => { active = false; };
  }, []);

  if (state === 'loading') return <div className="grid min-h-screen place-items-center text-[#237596]">Đang kiểm tra quyền quản trị...</div>;
  return state === 'admin' ? <Outlet /> : <Navigate to="/home" replace />;
}
