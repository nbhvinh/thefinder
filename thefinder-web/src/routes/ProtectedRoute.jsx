import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthValue } from '../utils/authStorage';

export default function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = getAuthValue('thefinder-authenticated') === 'true';
  return isAuthenticated ? <Outlet /> : <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
}
