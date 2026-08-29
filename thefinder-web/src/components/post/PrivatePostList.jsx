import { useEffect, useState } from 'react';
import HomePostCard from './HomePostCard';
import { getPosts } from '../../api/postApi';

function mapPost(post) {
  const imageUrls = (post.images ?? []).map(({ url }) => !url ? null : url.startsWith('http') ? url : `http://localhost:8080${url}`).filter(Boolean);
  return { id: post.id, title: post.title, type: post.type, tag: post.categoryName, description: post.description, location: post.location, eventTime: post.eventTime, contactInfo: post.contactInfo, createdAt: post.createdAt, author: post.authorName, status: post.status, imageUrls };
}

export default function PrivatePostList({ type, keyword, categoryId }) {
  const [posts, setPosts] = useState([]); const [message, setMessage] = useState('Đang tải bài đăng...');
  useEffect(() => { let active = true; getPosts({ ...(type ? { type } : {}), ...(keyword ? { keyword } : {}), ...(categoryId ? { categoryId } : {}) }).then((data) => { if (active) { const mapped = data.map(mapPost); setPosts(mapped); setMessage(mapped.length ? '' : 'Chưa có bài đăng nào.'); } }).catch(() => { if (active) setMessage('Không thể tải bài đăng. Hãy kiểm tra backend.'); }); return () => { active = false; }; }, [type, keyword, categoryId]);
  return <section className="mx-auto flex w-[calc(100%-2rem)] max-w-[780px] flex-col gap-4 py-5 sm:w-[calc(100%-3rem)]" aria-label="Danh sách bài đăng">{message && <p className="text-center text-slate-500">{message}</p>}{posts.map((post) => <HomePostCard key={post.id} post={post} onFound={() => setMessage('Cảm ơn bạn. Tính năng xác nhận sẽ được bổ sung cùng API xử lý bài đăng.')} />)}</section>;
}
