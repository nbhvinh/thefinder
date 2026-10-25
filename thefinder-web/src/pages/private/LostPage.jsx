import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import PrivatePostList from '../../components/post/PrivatePostList';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RecentEventsBar from '../../components/post/RecentEventsBar';
import CreatePostModal from '../../components/post/CreatePostModal';
export default function LostPage() {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);
  useEffect(() => {
    const openCreatePost = () => setCreatingPost(true);
    window.addEventListener('thefinder:create-post', openCreatePost);
    return () => window.removeEventListener('thefinder:create-post', openCreatePost);
  }, []);
  return <div className="mobile-sidebar-page authenticated-page min-h-screen bg-white"><AuthenticatedNavigation /><section className="relative mx-auto mt-5 grid min-h-72 w-[calc(100%-2rem)] max-w-[780px] place-items-center overflow-hidden rounded-[18px] px-4 text-center text-white"><div className="absolute inset-0 bg-[linear-gradient(#00000066,#00000066),url('/assets/anima/public-home/menu.webp')] bg-cover bg-center" /><div className="relative"><h1 className="text-3xl md:text-4xl">Bạn có nhặt được của rơi?<br />Tìm lại chủ nhân thôi!</h1><button onClick={() => navigate('/posts/create/found')} className="mt-8 h-[67px] w-[280px] rounded-[18px] border border-[#1882ac] bg-white text-2xl text-black">Trả lại đồ</button></div></section><RecentEventsBar selectedId={categoryId} onChange={setCategoryId} /><PrivatePostList type="LOST" categoryId={categoryId} />{creatingPost && <CreatePostModal initialType="LOST" onClose={() => setCreatingPost(false)} />}</div>;
}
