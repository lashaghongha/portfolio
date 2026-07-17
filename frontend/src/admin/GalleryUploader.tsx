import { useRef, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import type { GalleryItem } from '../lib/api';
import { uploadImage, resolveAsset } from '../lib/admin-api';
import { ACCEPTED_IMAGE_TYPES, IMAGE_HINT, validateImageFile } from './ImageUploader';

export default function GalleryUploader({
  value,
  onChange,
}: {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList) {
    setBusy(true);
    const uploaded: GalleryItem[] = [];
    let lastError = '';
    for (const file of Array.from(files)) {
      const problem = validateImageFile(file);
      if (problem) {
        lastError = problem;
        continue;
      }
      try {
        setStatus('Uploading…');
        // eslint-disable-next-line no-await-in-loop -- sequential keeps upload order stable
        const url = await uploadImage(file);
        uploaded.push({ url, caption: '' });
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Upload failed.';
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    setStatus(lastError || (uploaded.length ? `Added ${uploaded.length} photo(s).` : ''));
    setBusy(false);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setCaptionAt(index: number, caption: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, caption } : item)));
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {value.map((item, i) => (
          <div key={`${item.url}-${i}`} className="flex gap-3 rounded-lg border border-line bg-bg-soft p-2">
            <div className="group relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-bg">
              <img src={resolveAsset(item.url) ?? ''} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
            <input
              type="text"
              value={item.caption ?? ''}
              onChange={(e) => setCaptionAt(i, e.target.value)}
              placeholder="Caption (optional)"
              className="min-w-0 flex-1 self-center rounded-lg border border-line bg-bg px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-accent/60"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid aspect-video min-h-24 place-items-center rounded-lg border border-dashed border-line bg-bg-soft text-slate-500 transition-colors hover:border-accent/50 hover:text-accent-soft"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <p className={`mt-2 text-xs ${status ? 'text-slate-400' : 'text-slate-600'}`}>{status || IMAGE_HINT}</p>
    </div>
  );
}
