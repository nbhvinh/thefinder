import { useEffect, useId, useMemo } from 'react';

export default function ImageUploadField({ files, onChange, maxFiles = 4, label = `Ảnh vật phẩm (tối đa ${maxFiles} ảnh)` }) {
  const inputId = useId();
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function selectFiles(event) {
    onChange([...files, ...event.target.files].slice(0, maxFiles));
    event.target.value = '';
  }

  return (
    <div className="text-base text-black">
      <span>{label}</span>
      <div className="mt-2 flex items-center gap-[5px]">
        <label htmlFor={inputId} aria-label="Chọn ảnh vật phẩm" className="grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-md border border-[#1882ac] bg-white text-xl leading-none text-[#237596] hover:bg-[#eef8fc]">+</label>
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} className="sr-only" />
        {previews.map((preview, index) => <span key={`${preview.file.name}-${preview.file.lastModified}`} className="relative"><img src={preview.url} alt={`Ảnh xem trước ${preview.file.name}`} className="h-[54px] w-[54px] rounded-lg object-cover" /><button type="button" aria-label={`Xóa ${preview.file.name}`} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs text-white">×</button></span>)}
      </div>
    </div>
  );
}
