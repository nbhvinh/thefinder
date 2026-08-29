import CategoryFilter from './CategoryFilter';

export default function RecentEventsBar({ selectedId, onChange }) {
  return (
    <section className="px-4 py-4 sm:px-6" aria-label="Lọc bài đăng theo danh mục">
      <div className="mx-auto flex max-w-[780px] justify-center">
        <CategoryFilter selectedId={selectedId} onChange={onChange} />
      </div>
    </section>
  );
}
