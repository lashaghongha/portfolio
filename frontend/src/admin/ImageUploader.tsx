import { useRef, useState } from 'react';
import { Upload, ImageOff, Loader2, X } from 'lucide-react';
import { uploadImage, resolveAsset } from '../lib/admin-api';

// Keep these in sync with AdminEndpoints.cs (server-side limits).
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const HINT = 'PNG, JPG, WebP, GIF or SVG · up to 5MB';

function validate(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported file type.';
  if (file.size > MAX_BYTES) return 'File too large (max 5MB).';
  return null;
}

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = resolveAsset(value);

  async function handleFile(file: File) {
    const problem = validate(file);
    if (problem) {
      setStatus(problem);
      return;
    }
    setBusy(true);
    setStatus('Uploading…');
    try {
      const url = await uploadImage(file);
      onChange(url);
      setStatus('Uploaded.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
        className={`relative grid aspect-video cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed transition-colors ${
          dragging ? 'border-accent bg-accent/10' : 'border-line bg-bg-soft hover:border-accent/50'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
                <Upload size={13} /> Replace
              </span>
            </div>
          </>
        ) : busy ? (
          <Loader2 size={22} className="animate-spin text-accent-soft" />
        ) : (
          <div className="px-3 text-center">
            <ImageOff size={22} className="mx-auto text-slate-600" />
            <p className="mt-2 text-xs text-slate-500">Drag &amp; drop or click</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`text-xs ${status ? 'text-slate-400' : 'text-slate-600'}`}>{status || HINT}</span>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setStatus('');
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-400"
          >
            <X size={12} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
