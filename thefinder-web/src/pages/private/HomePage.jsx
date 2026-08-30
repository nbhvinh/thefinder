import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import AuthenticatedNavigation from '../../components/navigation/AuthenticatedNavigation';
import PrivatePostList from '../../components/post/PrivatePostList';
import RecentEventsBar from '../../components/post/RecentEventsBar';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState(null);
  const navigate = useNavigate();
  const keyword = searchParams.get('keyword') || '';
  const searchedCategoryId = Number(searchParams.get('categoryId')) || null;
  const activeCategoryId = searchedCategoryId || categoryId;
  const isSearchMode = Boolean(keyword.trim() || searchedCategoryId);

  function changeCategory(nextCategoryId) {
    setCategoryId(nextCategoryId);
    if (searchedCategoryId) navigate('/home', { replace: true });
  }

  return (
    <div className="authenticated-page min-h-screen bg-white">
      <AuthenticatedNavigation />
      <main>
        {!isSearchMode && <div className="mx-auto w-[calc(100%-2rem)] max-w-[780px] pt-5 sm:w-[calc(100%-3rem)]">
          <section className="rounded-[26px] border border-[#237596] px-5 py-4 sm:px-7" aria-label="Tạo bài đăng mới">
            <Link
              to="/posts/create/lost"
              className="flex h-12 w-full items-center rounded-full border border-[#aeb4b7] bg-white px-5 text-sm text-black/65 transition-colors hover:border-[#237596] hover:bg-[#f7fbfd] sm:text-base"
            >
              Bắt đầu bài đăng tìm đồ
            </Link>

            <nav className="mt-3 grid grid-cols-3 items-center text-center" aria-label="Loại bài đăng">
              <Link to="/posts/create/lost" className="px-2 py-2 text-sm font-medium text-black hover:text-[#237596] sm:text-base">
                Đăng tìm đồ
              </Link>
              <Link to="/posts/create/found" className="px-2 py-2 text-sm font-medium text-black hover:text-[#237596] sm:text-base">
                Đăng trả đồ
              </Link>
              <span aria-disabled="true" title="Tính năng đang tạm khóa" className="cursor-not-allowed px-2 py-2 text-sm font-medium text-black/40 sm:text-base">
                Cảnh báo trộm
              </span>
            </nav>
          </section>
        </div>}

        {!isSearchMode && <div className="mt-4">
          <RecentEventsBar selectedId={activeCategoryId} onChange={changeCategory} />
        </div>}
        <PrivatePostList keyword={keyword} categoryId={activeCategoryId} />
      </main>
    </div>
  );
}
