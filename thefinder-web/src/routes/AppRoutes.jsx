import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('thefinder:scroll-restored', { detail: { scrollY: 0 } }));
  }, [pathname]);

  return null;
}

export default function AppRoutes() {
  return <BrowserRouter><ScrollToTop /><Routes><Route path="/" element={<PublicHomePage />} /><Route path="/lost" element={<LostPostsPage />} /><Route path="/found" element={<FoundPostsPage />} /><Route path="/sign-in" element={<SignInPage />} /><Route path="/sign-up" element={<SignUpPage />} /><Route element={<ProtectedRoute />}><Route path="/home" element={<HomePage />} /><Route path="/home/lost" element={<PrivateLostPage />} /><Route path="/home/found" element={<PrivateFoundPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/posts/create/lost" element={<CreateLostPostPage />} /><Route path="/posts/create/found" element={<CreateFoundPostPage />} /><Route path="/posts/:postId/claim" element={<CreateClaimPage />} /><Route path="/claims/received" element={<ClaimsListPage mode="received" />} /><Route path="/claims/sent" element={<ClaimsListPage mode="sent" />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}
