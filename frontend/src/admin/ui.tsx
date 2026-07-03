import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-accent/60';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[90px] resize-y ${props.className ?? ''}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        checked ? 'border-accent/50 bg-accent/10 text-accent-soft' : 'border-line text-slate-400'
      }`}
    >
      <span className={`h-4 w-7 rounded-full p-0.5 transition-colors ${checked ? 'bg-accent' : 'bg-slate-700'}`}>
        <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-3' : ''}`} />
      </span>
      {label}
    </button>
  );
}
