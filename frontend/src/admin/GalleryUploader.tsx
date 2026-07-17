import { useRef, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { uploadImage, resolveAsset } from '../lib/admin-api';
import { ACCEPTED_IMAGE_TYPES, IMAGE_HINT, validateImageFile } from './ImageUploader';

export default function GalleryUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList) {
    setBusy(true);
    const uploaded: string[] = [];
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
        uploaded.push(url);
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

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative aspect-video overflow-hidden rounded-lg border border-line bg-bg-soft">
            <img src={resolveAsset(url) ?? ''} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid aspect-video place-items-center rounded-lg border border-dashed border-line bg-bg-soft text-slate-500 transition-colors hover:border-accent/50 hover:text-accent-soft"
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
