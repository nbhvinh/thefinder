import { useEffect, useId, useMemo } from 'react';

export default function ImageUploadField({ files, onChange }) {
  const inputId = useId();
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function selectFiles(event) {
    onChange([...event.target.files].slice(0, 4));
    event.target.value = '';
  }

  return (
    <div className="text-base text-black">
      <span>Ảnh vật phẩm (tối đa 4 ảnh)</span>
      <div className="mt-2 flex items-center gap-[5px]">
        <label htmlFor={inputId} aria-label="Chọn ảnh vật phẩm" className="grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-md border border-[#1882ac] bg-white text-xl leading-none text-[#237596] hover:bg-[#eef8fc]">+</label>
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} className="sr-only" />
        {previews.map((preview) => <img key={`${preview.file.name}-${preview.file.lastModified}`} src={preview.url} alt={`Ảnh xem trước ${preview.file.name}`} className="h-[30px] w-[30px] rounded object-cover" />)}
      </div>
    </div>
  );
}
