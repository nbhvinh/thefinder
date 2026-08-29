import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavigation from '../../components/navigation/PublicNavigation';
import PrivatePostList from '../../components/post/PrivatePostList';
import RecentEventsBar from '../../components/post/RecentEventsBar';

export default function FoundPostsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  return <div className="min-h-screen bg-white text-black"><PublicNavigation /><main aria-label="Danh sách đồ tìm thấy"><section className="relative grid min-h-80 place-items-center overflow-hidden px-4 text-center text-white" aria-labelledby="hero-title"><div className="absolute inset-0 bg-[linear-gradient(#00000066,#00000066),url('/assets/anima/public-home/menu.png')] bg-cover bg-center" /><div className="relative z-10"><h1 id="hero-title" className="text-3xl leading-relaxed md:text-4xl">Bạn mất thứ gì à?<br />Cùng cộng đồng tìm lại nhé</h1><button type="button" onClick={() => navigate('/sign-in')} className="mt-14 h-[67px] w-[280px] rounded-[30px] bg-[#237596] text-2xl">Tìm lại đồ</button></div></section><RecentEventsBar headingId="recent-events-heading" selectedId={selectedCategory} onChange={setSelectedCategory} /><PrivatePostList type="FOUND" categoryId={selectedCategory} /></main></div>;
}
