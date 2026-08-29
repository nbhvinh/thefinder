import CategoryFilter from './CategoryFilter';

export default function RecentEventsBar({ selectedId, onChange, headingId }) {
  return (
    <section className="min-h-[96px] bg-[#d9d9d9] px-5 py-5" aria-labelledby={headingId}>
      <div className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-between gap-x-12 gap-y-4">
        <h2 id={headingId} className="shrink-0 text-2xl font-semibold text-black md:text-[28px]">
          Sự việc gần đây
        </h2>
        <CategoryFilter selectedId={selectedId} onChange={onChange} />
      </div>
    </section>
  );
}
