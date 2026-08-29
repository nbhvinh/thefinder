import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import PrivatePostList from '../../components/post/PrivatePostList';
import RecentEventsBar from '../../components/post/RecentEventsBar';

export default function HomePage() {
  const [searchParams] = useSearchParams(); const navigate = useNavigate(); const [categoryId, setCategoryId] = useState(null);
  return <div className="min-h-screen bg-white"><AuthenticatedNavigation /><main><div className="mx-auto max-w-[1033px] px-4 pt-6"><section className="flex min-h-[107px] flex-wrap items-center justify-center gap-3 rounded-[30px] border border-[#237596] p-5"><div className="flex h-[67px] w-full max-w-[402px] items-center justify-center rounded-[30px] bg-[#d9d9d9]"><h1 className="text-3xl text-black md:text-4xl">Tình trạng hôm nay?</h1></div><button type="button" onClick={() => navigate('/posts/create/lost')} className="h-[67px] w-[280px] rounded-[30px] bg-[#237596] text-2xl text-white">Tìm lại đồ</button><button type="button" onClick={() => navigate('/posts/create/found')} className="h-[67px] w-[280px] rounded-[30px] border border-[#1882ac] bg-white text-2xl text-black">Trả lại đồ</button></section></div><div className="mt-4"><RecentEventsBar headingId="recent-home-heading" selectedId={categoryId} onChange={setCategoryId} /></div><PrivatePostList keyword={searchParams.get('keyword') || ''} categoryId={categoryId} /></main></div>;
}
