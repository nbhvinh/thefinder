import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavigation from '../../components/navigation/PublicNavigation';
import PrivatePostList from '../../components/post/PrivatePostList';
import RecentEventsBar from '../../components/post/RecentEventsBar';

export default function PublicHomePage() {
  const [selectedCategory, setSelectedCategory] = useState(''); const [searchParams] = useSearchParams(); const navigate = useNavigate();
  return <div className="min-h-screen bg-white text-black"><PublicNavigation /><main aria-label="Trang chủ tìm đồ thất lạc"><section className="relative grid min-h-[409px] place-items-center overflow-hidden px-4 text-center text-white" aria-labelledby="hero-heading"><div className="absolute inset-0 bg-[linear-gradient(#00000066,#00000066),url('/assets/anima/public-home/menu.png')] bg-cover bg-center" /><div className="relative z-10 flex flex-col items-center"><h1 id="hero-heading" className="text-3xl leading-relaxed md:text-4xl">Bạn mất đồ?<br />Nhặt được món đồ không rõ chủ nhân?<br />Hãy cùng chúng tôi tìm lại nhé!</h1><div className="mt-14 flex flex-wrap justify-center gap-8 md:gap-24"><button type="button" onClick={() => navigate('/sign-in')} className="h-[67px] w-[280px] rounded-[30px] border border-[#1882ac] bg-white text-2xl text-black">Trả lại đồ</button><button type="button" onClick={() => navigate('/sign-in')} className="h-[67px] w-[280px] rounded-[30px] bg-[#237596] text-2xl">Tìm lại đồ</button></div></div></section><RecentEventsBar headingId="recent-heading" selectedId={selectedCategory} onChange={setSelectedCategory} /><PrivatePostList keyword={searchParams.get('keyword') || ''} categoryId={selectedCategory} /></main></div>;
}
