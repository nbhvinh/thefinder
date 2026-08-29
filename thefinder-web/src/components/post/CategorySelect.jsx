import { useEffect, useState } from 'react';
import { getCategories } from '../../api/categoryApi';

export default function CategorySelect({ value, onChange }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  return <label htmlFor="categoryId" className="block text-base text-black">Danh mục<select id="categoryId" value={value ?? ''} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} className="mt-2 h-11 w-full rounded-lg border border-[#d9d9d9] bg-white px-4 text-black outline-none focus:border-[#237596]"><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>;
}
