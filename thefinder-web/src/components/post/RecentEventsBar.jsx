import CategoryFilter from './CategoryFilter';

export default function RecentEventsBar({ selectedId, onChange }) {
  return (
    <section className="hidden px-4 py-4 sm:px-6 md:block" aria-label="Lọc bài đăng theo danh mục">
      <div className="mx-auto flex max-w-[780px] justify-center">
        <CategoryFilter selectedId={selectedId} onChange={onChange} />
      </div>
    </section>
  );
}
