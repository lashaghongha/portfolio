import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X, ExternalLink } from 'lucide-react';
import { uploadCv, resolveAsset } from '../lib/admin-api';

const MAX_BYTES = 10 * 1024 * 1024;

export default function CvUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const href = resolveAsset(value);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setStatus('Only PDF files are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus('File too large (max 10MB).');
      return;
    }
    setBusy(true);
    setStatus('Uploading…');
    try {
      const url = await uploadCv(file);
      onChange(url);
      setStatus('Uploaded.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-soft p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent-soft">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          {value ? (
            <a
              href={href ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-soft hover:text-white"
            >
              View current CV <ExternalLink size={13} />
            </a>
          ) : (
            <p className="text-sm text-slate-400">No CV uploaded yet</p>
          )}
          <p className="text-xs text-slate-600">PDF · up to 10MB</p>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-ghost !py-1.5 text-xs"
        >
          <Upload size={13} /> {value ? 'Replace' : 'Upload'}
        </button>
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

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {status && <p className="mt-2 text-xs text-slate-400">{status}</p>}
    </div>
  );
}
