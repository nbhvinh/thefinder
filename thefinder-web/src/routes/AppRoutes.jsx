import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import PublicHomePage from '../pages/public/PublicHomePage';
import FoundPostsPage from '../pages/public/FoundPostsPage';
import LostPostsPage from '../pages/public/LostPostsPage';
import SignInPage from '../pages/auth/SignInPage';
import SignUpPage from '../pages/auth/SignUpPage';
import ProtectedRoute from './ProtectedRoute';
import CreateLostPostPage from '../pages/private/CreateLostPostPage';
import CreateFoundPostPage from '../pages/private/CreateFoundPostPage';
import HomePage from '../pages/private/HomePage';
import PrivateLostPage from '../pages/private/LostPage';
import PrivateFoundPage from '../pages/private/FoundPage';
import CreateClaimPage from '../pages/private/CreateClaimPage';
import ClaimsListPage from '../pages/private/ClaimsListPage';
import ProfilePage from '../pages/private/ProfilePage';
import AdminRoute from './AdminRoute';
import AdminReportsPage from '../pages/private/AdminReportsPage';
import AdminBlacklistPage from '../pages/private/AdminBlacklistPage';
import AccountSettingsPage from '../pages/private/AccountSettingsPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('thefinder:scroll-restored', { detail: { scrollY: 0 } }));
  }, [pathname]);

  return null;
}

function AppLayout() {
  return <><ScrollToTop /><Outlet /></>;
}

const router = createBrowserRouter([
  { element: <AppLayout />, children: [
  { path: '/', element: <PublicHomePage /> },
  { path: '/lost', element: <LostPostsPage /> },
  { path: '/found', element: <FoundPostsPage /> },
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/sign-up', element: <SignUpPage /> },
  { element: <ProtectedRoute />, children: [
    { path: '/home', element: <HomePage /> },
    { path: '/home/lost', element: <PrivateLostPage /> },
    { path: '/home/found', element: <PrivateFoundPage /> },
    { path: '/profile', element: <ProfilePage /> },
    { path: '/users/:userId', element: <ProfilePage /> },
    { path: '/settings', element: <AccountSettingsPage /> },
    { path: '/posts/create/lost', element: <CreateLostPostPage /> },
    { path: '/posts/create/found', element: <CreateFoundPostPage /> },
    { path: '/posts/:postId/claim', element: <CreateClaimPage /> },
    { path: '/claims/received', element: <ClaimsListPage mode="received" /> },
    { path: '/claims/sent', element: <ClaimsListPage mode="sent" /> },
    { element: <AdminRoute />, children: [
      { path: '/admin/reports', element: <AdminReportsPage /> },
      { path: '/admin/blacklist', element: <AdminBlacklistPage /> },
    ] },
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
  ] },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} fallbackElement={<div className="min-h-screen bg-white" />} />;
}
