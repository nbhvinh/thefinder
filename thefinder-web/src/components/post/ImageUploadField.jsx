import { useEffect, useId, useMemo, useState } from 'react';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ImageUploadField({ files, onChange, maxFiles = 4, label = `Ảnh vật phẩm (tối đa ${maxFiles} ảnh)` }) {
  const inputId = useId();
  const [error, setError] = useState('');
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function selectFiles(event) {
    const selectedFiles = [...event.target.files];
    const unsupportedFile = selectedFiles.find((file) => {
      const lowerName = file.name.toLowerCase();
      return !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())
        || !ALLOWED_IMAGE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
    });
    const oversizedFile = selectedFiles.find((file) => file.size > MAX_IMAGE_SIZE);

    if (unsupportedFile) {
      setError(`“${unsupportedFile.name}” không được hỗ trợ. Chỉ nhận JPG, JPEG, PNG hoặc WebP.`);
    } else if (oversizedFile) {
      setError(`“${oversizedFile.name}” vượt quá giới hạn 5 MB.`);
    } else if (files.length + selectedFiles.length > maxFiles) {
      setError(`Chỉ được chọn tối đa ${maxFiles} ảnh.`);
    } else {
      setError('');
      onChange([...files, ...selectedFiles]);
    }
    event.target.value = '';
  }

  return (
    <div className="text-base text-black">
      <span>{label}</span>
      <p className="mt-1 text-xs text-slate-500">Hỗ trợ JPG, JPEG, PNG, WebP; tối đa 5 MB mỗi ảnh.</p>
      <div className="mt-2 flex items-center gap-[5px]">
        <label htmlFor={inputId} aria-label="Chọn ảnh vật phẩm" className="grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-md border border-[#1882ac] bg-white text-xl leading-none text-[#237596] hover:bg-[#eef8fc]">+</label>
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} className="sr-only" />
        {previews.map((preview, index) => <span key={`${preview.file.name}-${preview.file.lastModified}`} className="relative"><img src={preview.url} alt={`Ảnh xem trước ${preview.file.name}`} className="h-[54px] w-[54px] rounded-lg object-cover" /><button type="button" aria-label={`Xóa ${preview.file.name}`} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs text-white">×</button></span>)}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
