import { useEffect, useRef, useState } from 'react';
import { getCategories } from '../../api/categoryApi';

const fallbackCategories = [
  { id: 1, name: 'Balo/Túi xách' },
  { id: 2, name: 'Ví/Giấy tờ' },
  { id: 3, name: 'Điện thoại' },
  { id: 4, name: 'Laptop/Máy tính' },
  { id: 5, name: 'Bút/Văn phòng phẩm' },
  { id: 6, name: 'Trang sức' },
  { id: 7, name: 'Chìa khóa' },
  { id: 8, name: 'Thú cưng' },
  { id: 9, name: 'Khác' },
];

export default function CategoryFilter({ selectedId, onChange }) {
  const [categories, setCategories] = useState(fallbackCategories);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories([...data].sort((a, b) => a.id - b.id));
        }
      })
      .catch(() => setCategories(fallbackCategories));
  }, []);

  useEffect(() => {
    function closeDropdown(event) {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    }

    document.addEventListener('pointerdown', closeDropdown);
    return () => document.removeEventListener('pointerdown', closeDropdown);
  }, []);

  const primary = categories.slice(0, 5);
  const remaining = categories.slice(5);
  const select = (category) => { onChange(selectedId === category.id ? null : category.id); setIsOpen(false); };

  return <div className="flex flex-wrap items-center justify-center gap-2.5 lg:flex-nowrap" aria-label="Lọc theo danh mục">{primary.map((category) => <button key={category.id} type="button" aria-pressed={selectedId === category.id} onClick={() => select(category)} className={`h-[38px] min-w-[100px] whitespace-nowrap rounded-[30px] border border-[#1882ac] px-4 text-sm font-medium transition-colors hover:bg-[#f4fbfe] ${selectedId === category.id ? 'bg-[#237596] text-white' : 'bg-white text-black'}`}>{category.name}</button>)}{remaining.length > 0 && <div ref={dropdownRef} className="relative shrink-0"><button type="button" aria-label="Hiện thêm danh mục" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} className={`grid h-[38px] w-[38px] place-items-center rounded-full border border-[#1882ac] text-sm font-semibold ${remaining.some((category) => category.id === selectedId) ? 'bg-[#237596] text-white' : 'bg-white text-black'}`}>...</button>{isOpen && <div className="absolute right-0 top-full z-30 mt-2 min-w-56 rounded-xl border border-[#1882ac] bg-white p-2 shadow-lg">{remaining.map((category) => <button key={category.id} type="button" aria-pressed={selectedId === category.id} onClick={() => select(category)} className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#eef8fc] ${selectedId === category.id ? 'bg-[#237596] text-white hover:bg-[#237596]' : 'text-black'}`}>{category.name}</button>)}</div>}</div>}</div>;
}
