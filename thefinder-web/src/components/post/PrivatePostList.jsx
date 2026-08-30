import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePostCard from './HomePostCard';
import { getPosts } from '../../api/postApi';
import { getCurrentUser } from '../../api/authApi';
import { getMyClaims } from '../../api/claimApi';

function mapPost(post) {
  const imageUrls = (post.images ?? [])
    .map(({ url }) => !url ? null : url.startsWith('http') ? url : `http://localhost:8080${url}`)
    .filter(Boolean);
  return { id: post.id, title: post.title, type: post.type, tag: post.categoryName, description: post.description, location: post.location, eventTime: post.eventTime, contactInfo: post.contactInfo, createdAt: post.createdAt, authorId: post.authorId, author: post.authorName, status: post.status, imageUrls };
}

export default function PrivatePostList({ type, keyword, categoryId }) {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [claimsByPost, setClaimsByPost] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getPosts({ ...(type ? { type } : {}), ...(keyword ? { keyword } : {}), ...(categoryId ? { categoryId } : {}) }),
      getCurrentUser(),
      getMyClaims(),
    ]).then(([postsResult, userResult, claimsResult]) => {
      if (!active) return;

      if (postsResult.status === 'rejected') {
        setMessage('Không thể tải bài đăng. Hãy kiểm tra backend.');
        return;
      }

      const data = postsResult.value;
      const mapped = data.map(mapPost);
      setPosts(mapped);
      setUserId(userResult.status === 'fulfilled' ? userResult.value.data.id : null);
      setClaimsByPost(claimsResult.status === 'fulfilled'
        ? Object.fromEntries(claimsResult.value
          .filter((claim) => claim.status === 'SUBMITTED' || claim.status === 'PENDING' || claim.status === 'REVIEWING')
          .map((claim) => [claim.postId, claim.status]))
        : {});
      setMessage(mapped.length ? '' : 'Chưa có bài đăng nào.');
    });
    return () => { active = false; };
  }, [type, keyword, categoryId]);

  return <section className="mx-auto flex w-[calc(100%-2rem)] max-w-[780px] flex-col gap-4 py-5 sm:w-[calc(100%-3rem)]" aria-label="Danh sách bài đăng">
    {message && <p className="text-center text-slate-500">{message}</p>}
    {posts.map((post) => <HomePostCard key={post.id} post={post} isOwner={post.authorId === userId} claimStatus={claimsByPost[post.id]} onFound={() => navigate(`/posts/${post.id}/claim`)} />)}
  </section>;
}
