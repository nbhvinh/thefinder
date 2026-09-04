import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePostCard from './HomePostCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPostsPage } from '../../api/postApi';
import { getCurrentUser } from '../../api/authApi';
import { getMyClaims } from '../../api/claimApi';
import { resolveApiAssetUrl } from '../../config/api';

function mapPost(post) {
  const imageUrls = (post.images ?? [])
    .map(({ url }) => resolveApiAssetUrl(url))
    .filter(Boolean);
  return { id: post.id, title: post.title, type: post.type, tag: post.categoryName, description: post.description, location: post.location, eventTime: post.eventTime, contactInfo: post.contactInfo, createdAt: post.createdAt, authorId: post.authorId, author: post.authorName, status: post.status, imageUrls };
}

function visiblePageNumbers(currentPage, totalPages) {
  return [...new Set([0, currentPage - 1, currentPage, currentPage + 1, totalPages - 1])]
    .filter((pageNumber) => pageNumber >= 0 && pageNumber < totalPages)
    .sort((a, b) => a - b);
}

export default function PrivatePostList({ type, keyword, categoryId }) {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [claimsByPost, setClaimsByPost] = useState({});
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });
  const filterKey = `${type || ''}|${keyword || ''}|${categoryId || ''}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  const navigate = useNavigate();

  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setPage(0);
  }

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getPostsPage({ page, ...(type ? { type } : {}), ...(keyword ? { keyword } : {}), ...(categoryId ? { categoryId } : {}) }),
      getCurrentUser(),
      getMyClaims(),
    ]).then(([postsResult, userResult, claimsResult]) => {
      if (!active) return;

      if (postsResult.status === 'rejected') {
        setMessage('Không thể tải bài đăng. Hãy kiểm tra backend.');
        return;
      }

      const response = postsResult.value;
      const data = response.content ?? response;
      const mapped = data.map(mapPost);
      setPosts(mapped);
      setPageInfo({ totalPages: response.totalPages ?? (mapped.length ? 1 : 0), totalElements: response.totalElements ?? mapped.length });
      setUserId(userResult.status === 'fulfilled' ? userResult.value.data.id : null);
      setClaimsByPost(claimsResult.status === 'fulfilled'
        ? Object.fromEntries(claimsResult.value
          .filter((claim) => claim.status === 'SUBMITTED' || claim.status === 'PENDING' || claim.status === 'REVIEWING')
          .map((claim) => [claim.postId, claim.status]))
        : {});
      setMessage(mapped.length ? '' : 'Chưa có bài đăng nào.');
    });
    return () => { active = false; };
  }, [type, keyword, categoryId, page]);

  const goToPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <section className="mx-auto flex w-[calc(100%-2rem)] max-w-[780px] flex-col gap-4 py-5 sm:w-[calc(100%-3rem)]" aria-label="Danh sách bài đăng">
    {message && <p className="text-center text-slate-500">{message}</p>}
    {posts.map((post) => <HomePostCard key={post.id} post={post} isOwner={post.authorId === userId} claimStatus={claimsByPost[post.id]} onFound={() => navigate(`/posts/${post.id}/claim`)} />)}
    {pageInfo.totalPages > 1 && <nav className="mt-2 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang bài đăng">
      <button type="button" disabled={page === 0} onClick={() => goToPage(page - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-[#237596] disabled:opacity-35" aria-label="Trang trước"><ChevronLeft className="h-5 w-5" /></button>
      {visiblePageNumbers(page, pageInfo.totalPages)
        .map((index, position, visible) => <span key={index} className="contents">{position > 0 && index - visible[position - 1] > 1 && <span aria-hidden="true" className="px-1">…</span>}<button type="button" onClick={() => goToPage(index)} aria-current={index === page ? 'page' : undefined} className={`h-10 min-w-10 rounded-full border border-[#237596] px-3 ${index === page ? 'bg-[#237596] text-white' : 'bg-white text-black'}`}>{index + 1}</button></span>)}
      <button type="button" disabled={page + 1 >= pageInfo.totalPages} onClick={() => goToPage(page + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-[#237596] disabled:opacity-35" aria-label="Trang sau"><ChevronRight className="h-5 w-5" /></button>
      <p className="basis-full text-center text-xs text-slate-500">{pageInfo.totalElements} bài đăng · Trang {page + 1}/{pageInfo.totalPages}</p>
    </nav>}
  </section>;
}
