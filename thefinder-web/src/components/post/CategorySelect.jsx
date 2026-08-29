import { useEffect, useState } from 'react';
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

export default function CategorySelect({ value, onChange }) {
  const [categories, setCategories] = useState(fallbackCategories);
  const [selectedOption, setSelectedOption] = useState(value == null ? '' : String(value));

  useEffect(() => {
    getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories([...data].sort((a, b) => a.id - b.id));
      })
      .catch(() => setCategories(fallbackCategories));
  }, []);

  const namedCategories = categories.filter((category) => category.name.trim().toLocaleLowerCase('vi-VN') !== 'khác');
  function selectCategory(event) {
    const option = event.target.value;
    setSelectedOption(option);
    onChange(option && option !== 'other' ? Number(option) : null);
  }

  return <label htmlFor="categoryId" className="block text-base text-black">Danh mục<select id="categoryId" value={selectedOption} onChange={selectCategory} className="mt-2 h-11 w-full rounded-lg border border-[#d9d9d9] bg-white px-4 text-black outline-none focus:border-[#237596]"><option value="">Chọn danh mục</option>{namedCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}<option value="other">Khác</option></select></label>;
}
