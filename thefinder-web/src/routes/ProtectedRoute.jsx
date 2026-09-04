import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = sessionStorage.getItem('thefinder-authenticated') === 'true';
  return isAuthenticated ? <Outlet /> : <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
}
