import { AlertTriangle, CircleCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCategories } from '../../api/categoryApi';
import { getPosts } from '../../api/postApi';

const fallbackCategories = [
  { id: 1, name: 'Balo/Túi xách' }, { id: 2, name: 'Ví/Giấy tờ' },
  { id: 3, name: 'Điện thoại' }, { id: 4, name: 'Laptop/Máy tính' },
  { id: 5, name: 'Bút/Văn phòng phẩm' }, { id: 6, name: 'Trang sức' },
  { id: 7, name: 'Chìa khóa' }, { id: 8, name: 'Thú cưng' }, { id: 9, name: 'Khác' },
];

function countByCategory(categories, posts) {
  const countsByName = posts.reduce((counts, post) => {
    const name = post.categoryName || 'Khác';
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});

  return categories
    .filter((category) => category.name?.trim().toLocaleLowerCase('vi') !== 'khác')
    .map((category) => ({ ...category, count: countsByName[category.name] || 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

function StatisticsSection({ title, description, statistics, isLoading, variant }) {
  const isLost = variant === 'lost';
  const Icon = isLost ? AlertTriangle : CircleCheck;

  return (
    <section className="flex min-h-0 shrink-0 flex-col" aria-label={title}>
      <div className="relative z-10 flex shrink-0 items-start gap-3 bg-white px-3 pb-[14px]">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isLost ? 'bg-[#fff2e6] text-[#d96b16]' : 'bg-[#eaf8ef] text-[#268b4b]'}`}><Icon className="h-5 w-5" /></span>
        <div>
          <h2 className="text-base font-semibold leading-snug text-black">{title}</h2>
          <p className="mt-1 text-xs text-black/50">{description}</p>
        </div>
      </div>

      <div
        className="min-h-0 shrink-0 space-y-1 overflow-y-auto pr-1"
        style={{ height: '252px', maxHeight: '252px', marginTop: '12px', paddingTop: '2px' }}
      >
        {statistics.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f5f8fa]">
            <span className="min-w-0 truncate text-sm text-black/75">{category.name}</span>
            <span className="shrink-0 rounded-full bg-[#eef8fc] px-2.5 py-1 text-xs font-semibold text-[#237596]">{isLoading ? '—' : category.count} bài đăng</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LostItemStats() {
  const initialStatistics = countByCategory(fallbackCategories, []);
  const [lostStatistics, setLostStatistics] = useState(initialStatistics);
  const [foundStatistics, setFoundStatistics] = useState(initialStatistics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getCategories(),
      getPosts({ type: 'LOST', size: 1000 }),
      getPosts({ type: 'FOUND', size: 1000 }),
    ]).then(([categoriesResult, lostResult, foundResult]) => {
      if (!active) return;
      const categories = categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value) && categoriesResult.value.length
        ? categoriesResult.value
        : fallbackCategories;
      const lostPosts = lostResult.status === 'fulfilled' && Array.isArray(lostResult.value) ? lostResult.value : [];
      const foundPosts = foundResult.status === 'fulfilled' && Array.isArray(foundResult.value) ? foundResult.value : [];
      setLostStatistics(countByCategory(categories, lostPosts));
      setFoundStatistics(countByCategory(categories, foundPosts));
      setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <aside className="fixed right-5 top-[30px] z-50 hidden max-h-[calc(100vh-30px)] w-[260px] flex-col overflow-hidden bg-white lg:flex" aria-label="Thống kê tình trạng đồ vật">
      <StatisticsSection title="Cảnh báo đồ bị mất" description="Bài đang tìm theo danh mục" statistics={lostStatistics} isLoading={isLoading} variant="lost" />
      <div className="flex h-[50px] shrink-0 items-center" aria-hidden="true"><div className="w-full" style={{ borderTop: '2px solid #1882ac' }} /></div>
      <StatisticsSection title="Thống kê đồ tìm thấy" description="Bài trả đồ theo danh mục" statistics={foundStatistics} isLoading={isLoading} variant="found" />
    </aside>
  );
}
