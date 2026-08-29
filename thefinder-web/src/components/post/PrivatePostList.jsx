import { useEffect, useState } from 'react';
import HomePostCard from './HomePostCard';
import { getPosts } from '../../api/postApi';

function mapPost(post) {
  const imageUrl = post.images?.[0]?.url;
  return { id: post.id, title: post.title, tag: post.categoryName, description: post.description, author: post.authorName, status: post.status, imageUrl: imageUrl && (imageUrl.startsWith('http') ? imageUrl : `http://localhost:8080${imageUrl}`) };
}

export default function PrivatePostList({ type, keyword, categoryId }) {
  const [posts, setPosts] = useState([]); const [message, setMessage] = useState('Đang tải bài đăng...');
  useEffect(() => { let active = true; getPosts({ ...(type ? { type } : {}), ...(keyword ? { keyword } : {}), ...(categoryId ? { categoryId } : {}) }).then((data) => { if (active) { const mapped = data.map(mapPost); setPosts(mapped); setMessage(mapped.length ? '' : 'Chưa có bài đăng nào.'); } }).catch(() => { if (active) setMessage('Không thể tải bài đăng. Hãy kiểm tra backend.'); }); return () => { active = false; }; }, [type, keyword, categoryId]);
  return <section className="mx-auto flex max-w-[1035px] flex-col gap-5 py-6" aria-label="Danh sách bài đăng">{message && <p className="text-center text-slate-500">{message}</p>}{posts.map((post) => <HomePostCard key={post.id} post={post} onClose={(id) => setPosts((current) => current.filter((item) => item.id !== id))} onFound={() => setMessage('Cảm ơn bạn. Tính năng xác nhận sẽ được bổ sung cùng API xử lý bài đăng.')} />)}</section>;
}
