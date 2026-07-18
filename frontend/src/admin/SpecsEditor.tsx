import { Plus, X } from 'lucide-react';
import type { SpecRow } from '../lib/api';

export default function SpecsEditor({
  value,
  onChange,
}: {
  value: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
}) {
  function addRow() {
    onChange([...value, { label: '', value: '' }]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setField(index: number, field: keyof SpecRow, next: string) {
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: next } : row)));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          <span>Label</span>
          <span>Value</span>
          <span />
        </div>
      )}

      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
          <input
            type="text"
            value={row.label}
            onChange={(e) => setField(i, 'label', e.target.value)}
            placeholder="Backend"
            className="min-w-0 rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-accent/60"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => setField(i, 'value', e.target.value)}
            placeholder="ASP.NET Core 9 Web API (C#)"
            className="min-w-0 rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-accent/60"
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label="Remove row"
            className="grid h-9 w-9 place-items-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-slate-400 hover:border-accent/50 hover:text-accent-soft"
      >
        <Plus size={15} /> Add row
      </button>
    </div>
  );
}
