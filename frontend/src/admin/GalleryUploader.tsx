import { useRef, useState } from 'react';
import { Plus, X, Loader2, GripVertical, Maximize2 } from 'lucide-react';
import type { GalleryItem } from '../lib/api';
import { uploadImage, resolveAsset } from '../lib/admin-api';
import { ACCEPTED_IMAGE_TYPES, IMAGE_HINT, validateImageFile } from './ImageUploader';
import { groupGallery } from '../lib/gallery';
import { useDragReorder } from '../hooks/useDragReorder';
import Lightbox from '../components/Lightbox';

export default function GalleryUploader({
  value,
  onChange,
}: {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { overIndex, getHandleProps, getContainerProps } = useDragReorder(value, onChange);

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
        uploaded.push({ url, caption: '', group: '' });
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Upload failed.';
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    setStatus(lastError || (uploaded.length ? `Added ${uploaded.length} photo(s).` : ''));
    setBusy(false);
  }

  const patchAt = (index: number, patch: Partial<GalleryItem>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const groups = groupGallery(value);
  const lightboxImages = value.map((it) => ({ src: resolveAsset(it.url) ?? '', caption: it.caption }));

  return (
    <div>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.name || '__ungrouped'}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-accent-soft">
                {group.name || 'Ungrouped'}
              </span>
              <span className="text-xs text-slate-600">· {group.entries.length}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {group.entries.map(({ item, index }, pos) => (
                <div
                  key={`${item.url}-${index}`}
                  {...getContainerProps(index)}
                  className={`flex gap-3 rounded-lg border bg-bg-soft p-2 transition-colors ${
                    overIndex === index ? 'border-accent' : 'border-line'
                  }`}
                >
                  <div className="group relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-bg">
                    <img src={resolveAsset(item.url) ?? ''} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-1 top-1 z-20 grid h-5 min-w-5 place-items-center rounded-full bg-black/70 px-1 text-[11px] font-semibold text-white">
                      {pos + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightbox(index)}
                      aria-label="Enlarge photo"
                      className="absolute inset-0 z-0 grid place-items-center bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100"
                    >
                      <Maximize2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      aria-label="Remove photo"
                      title="Remove photo"
                      className="absolute right-1 top-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-600"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <input
                      type="text"
                      value={item.caption ?? ''}
                      onChange={(e) => patchAt(index, { caption: e.target.value })}
                      placeholder="Caption (optional)"
                      className="min-w-0 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-accent/60"
                    />
                    <input
                      type="text"
                      value={item.group ?? ''}
                      onChange={(e) => patchAt(index, { group: e.target.value })}
                      placeholder="Group (e.g. Admin panel)"
                      list="gallery-groups"
                      className="min-w-0 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-accent/60"
                    />
                  </div>

                  <button
                    type="button"
                    {...getHandleProps(index)}
                    aria-label="Drag to reorder"
                    title="Drag to reorder"
                    className="flex cursor-grab items-center self-stretch rounded-md px-1 text-slate-600 hover:text-slate-300 active:cursor-grabbing"
                  >
                    <GripVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid aspect-video min-h-24 w-full max-w-[calc(50%-0.375rem)] place-items-center rounded-lg border border-dashed border-line bg-bg-soft text-slate-500 transition-colors hover:border-accent/50 hover:text-accent-soft"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </div>

      {/* Shared datalist so typed group names autocomplete across items. */}
      <datalist id="gallery-groups">
        {groups.map((g) => g.name && <option key={g.name} value={g.name} />)}
      </datalist>

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

      <p className={`mt-2 text-xs ${status ? 'text-slate-400' : 'text-slate-600'}`}>
        {status || `${IMAGE_HINT} · drag the grip to reorder · set a Group to section photos`}
      </p>

      {lightbox !== null && (
        <Lightbox
          images={lightboxImages}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}
    </div>
  );
}
