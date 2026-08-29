import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavigation from '../../components/navigation/PublicNavigation';
import PrivatePostList from '../../components/post/PrivatePostList';
import RecentEventsBar from '../../components/post/RecentEventsBar';

export default function LostPostsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  return <div className="min-h-screen bg-white text-black"><PublicNavigation /><main aria-label="Danh sách đồ bị mất"><section className="relative grid min-h-80 place-items-center overflow-hidden px-4 text-center text-white" aria-labelledby="lost-item-hero-title"><div className="absolute inset-0 bg-[linear-gradient(#00000066,#00000066),url('/assets/anima/public-home/menu.png')] bg-cover bg-center" /><div className="relative z-10"><h1 id="lost-item-hero-title" className="text-3xl leading-relaxed md:text-4xl">Bạn có nhặt được của rơi?<br />Tìm lại chủ nhân thôi!</h1><button type="button" onClick={() => navigate('/sign-in')} className="mt-14 h-[67px] w-[280px] rounded-[30px] border border-[#1882ac] bg-white text-2xl text-black">Trả lại đồ</button></div></section><RecentEventsBar headingId="recent-events-title" selectedId={selectedCategory} onChange={setSelectedCategory} /><PrivatePostList type="LOST" categoryId={selectedCategory} /></main></div>;
}
