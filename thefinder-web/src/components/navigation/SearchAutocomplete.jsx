import { useEffect, useMemo, useRef, useState } from 'react';
import { getCategories } from '../../api/categoryApi';
import { getPosts } from '../../api/postApi';
import { searchUsers } from '../../api/userApi';
import { useNavigate } from 'react-router-dom';

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

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export default function SearchAutocomplete({ id, value, onChange, onSearch, onFocusChange, textSize = 'text-sm', inputClassName = '' }) {
  const [titles, setTitles] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.allSettled([getPosts({ size: 100 }), getCategories()]).then(([postsResult, categoriesResult]) => {
      if (!active) return;
      setTitles(postsResult.status === 'fulfilled' ? [...new Set(postsResult.value.map((post) => post.title).filter(Boolean))] : []);
      setCategories(categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value) && categoriesResult.value.length > 0 ? categoriesResult.value : fallbackCategories);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || query.startsWith('#')) return undefined;
    let active = true;
    const timer = window.setTimeout(() => searchUsers(query).then((data) => {
      if (active) setUsers(Array.isArray(data) ? data : []);
    }).catch(() => { if (active) setUsers([]); }), 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [value]);

  const suggestions = useMemo(() => {
    const isTagSearch = value.trimStart().startsWith('#');
    const keyword = normalize(isTagSearch ? value.trimStart().slice(1) : value);
    if (!keyword && !isTagSearch) return [];
    const options = isTagSearch
      ? categories.map((category) => ({ label: `#${category.name}`, value: `#${category.name}`, categoryId: category.id }))
      : [
          ...(keyword.length >= 2 ? users.map((user) => ({ label: user.fullName, value: user.fullName, userId: user.id, kind: 'Người dùng' })) : []),
          ...titles.map((title) => ({ label: title, value: title })),
          ...categories.map((category) => ({ label: category.name, value: category.name })),
        ];
    return options
      .filter((option) => !keyword || normalize(option.label.replace(/^#/, '')).includes(keyword))
      .sort((a, b) => normalize(a.label.replace(/^#/, '')).startsWith(keyword) === normalize(b.label.replace(/^#/, '')).startsWith(keyword) ? a.label.localeCompare(b.label, 'vi') : normalize(a.label.replace(/^#/, '')).startsWith(keyword) ? -1 : 1)
      .slice(0, 7);
  }, [categories, titles, users, value]);

  function selectSuggestion(suggestion) {
    onChange(suggestion.value);
    setIsOpen(false);
    setActiveIndex(-1);
    if (suggestion.userId) navigate(`/users/${suggestion.userId}`);
    else onSearch(suggestion.value, suggestion.categoryId);
    inputRef.current?.blur();
  }

  function submitSearch() {
    const tag = value.trimStart().startsWith('#') ? normalize(value.trimStart().slice(1)) : '';
    const matchedCategory = tag ? categories.find((category) => normalize(category.name) === tag) : null;
    const matchedUser = !tag ? users.find((user) => normalize(user.fullName) === normalize(value)) : null;
    setIsOpen(false);
    if (matchedUser) navigate(`/users/${matchedUser.id}`);
    else onSearch(value, matchedCategory?.id);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!suggestions.length || !isOpen) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  return (
    <form
      role="search"
      className="relative hidden shrink-0 sm:block"
      onSubmit={(event) => { event.preventDefault(); submitSearch(); }}
      onFocus={() => { onFocusChange(true); setIsOpen(true); }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onFocusChange(false);
          setIsOpen(false);
        }
      }}
    >
      <label htmlFor={id} className="sr-only">Tìm kiếm đồ thất lạc</label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(event) => { onChange(event.target.value); setIsOpen(true); setActiveIndex(-1); }}
        onKeyDown={handleKeyDown}
        placeholder=" Tìm kiếm (ví, giấy, ...)"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={`${id}-suggestions`}
        aria-expanded={isOpen}
        aria-activedescendant={activeIndex >= 0 ? `${id}-suggestion-${activeIndex}` : undefined}
        className={`h-8 w-[180px] rounded-[20px] border border-[#1882ac] bg-[#edecec] px-4 text-black outline-none transition-[width] duration-300 placeholder:text-[#00000066] focus:w-[280px] lg:focus:w-[480px] xl:focus:w-[650px] ${textSize} ${inputClassName}`}
      />
      {isOpen && !value.trim() && (
        <div className="absolute left-0 top-full z-[60] mt-2 w-full min-w-80 rounded-xl border border-[#1882ac] bg-white px-4 py-3 text-sm text-black/65 shadow-lg">
          tìm kiếm với '#' để tìm theo tag, VD: '#Điện thoại'
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul id={`${id}-suggestions`} role="listbox" className="absolute left-0 top-full z-[60] mt-2 w-full min-w-72 overflow-hidden rounded-xl border border-[#1882ac] bg-white p-1.5 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.userId ? `user-${suggestion.userId}` : `${suggestion.value}-${suggestion.categoryId ?? 'text'}`}`} id={`${id}-suggestion-${index}`} role="option" aria-selected={index === activeIndex}>
              <button type="button" onPointerDown={(event) => { event.preventDefault(); selectSuggestion(suggestion); }} className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm ${index === activeIndex ? 'bg-[#eef8fc] text-[#237596]' : 'text-black hover:bg-[#eef8fc]'}`}>
                <span className="flex items-center justify-between gap-3"><span className="truncate">{suggestion.label}</span>{suggestion.kind && <span className="shrink-0 text-xs text-[#237596]">{suggestion.kind}</span>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
