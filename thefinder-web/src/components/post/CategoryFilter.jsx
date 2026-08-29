import { useEffect, useState } from 'react';
import { getCategories } from '../../api/categoryApi';

export default function CategoryFilter({ selectedId, onChange }) {
  const [categories, setCategories] = useState([]); const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  const primary = categories.slice(0, 5); const remaining = categories.slice(5);
  const select = (category) => { onChange(selectedId === category.id ? null : category.id); setIsOpen(false); };
  return <div className="flex flex-1 flex-wrap items-center justify-end gap-4" aria-label="Lọc theo danh mục">{primary.map((category) => <button key={category.id} type="button" aria-pressed={selectedId === category.id} onClick={() => select(category)} className={`h-[42px] min-w-[150px] rounded-[30px] border border-[#1882ac] bg-white px-5 text-base font-medium transition-colors hover:bg-[#f4fbfe] ${selectedId === category.id ? 'bg-[#237596] text-white ring-2 ring-[#237596] ring-offset-2' : 'text-black'}`}>{category.name}</button>)}{remaining.length > 0 && <div className="relative"><button type="button" aria-label="Hiện thêm danh mục" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} className="grid h-[42px] w-[42px] place-items-center rounded-full border border-[#1882ac] bg-white text-base font-semibold">...</button>{isOpen && <div className="absolute right-0 z-20 mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">{remaining.map((category) => <button key={category.id} type="button" aria-pressed={selectedId === category.id} onClick={() => select(category)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${selectedId === category.id ? 'bg-slate-100 text-[#237596]' : ''}`}>{category.name}</button>)}</div>}</div>}</div>;
}
