import { useEffect, useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import type { Stat } from '../lib/api';
import { adminGetStats, createStat, updateStat, deleteStat } from '../lib/admin-api';
import { Field, TextInput } from './ui';

type Draft = Omit<Stat, 'id'> & { id: number | null };

const empty: Draft = { id: null, label: '', value: '', icon: 'trending-up', sortOrder: 0 };

function StatRow({ initial, onSaved, onDeleted }: {
  initial: Draft; onSaved: (s: Stat) => void; onDeleted: (id: number | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setBusy(true); setStatus('');
    try {
      const saved = draft.id == null
        ? await createStat(draft)
        : await updateStat(draft.id, { ...draft, id: draft.id });
      onSaved(saved);
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (draft.id == null) { onDeleted(null); return; }
    if (!confirm(`Delete "${draft.label}"?`)) return;
    setBusy(true);
    try { await deleteStat(draft.id); onDeleted(draft.id); }
    catch (err) { setStatus(err instanceof Error ? err.message : 'Delete failed.'); setBusy(false); }
  }

  return (
    <div className="card-surface flex flex-wrap items-end gap-3 p-4">
      <Field label="Value"><TextInput value={draft.value} onChange={(e) => set({ value: e.target.value })} className="w-28" /></Field>
      <Field label="Label"><TextInput value={draft.label} onChange={(e) => set({ label: e.target.value })} className="w-44" /></Field>
      <Field label="Icon (lucide)"><TextInput value={draft.icon} onChange={(e) => set({ icon: e.target.value })} className="w-36" /></Field>
      <Field label="Order"><TextInput type="number" value={draft.sortOrder}
        onChange={(e) => set({ sortOrder: Number(e.target.value) })} className="w-20" /></Field>
      <button onClick={save} disabled={busy} className="btn-primary !py-2 text-sm disabled:opacity-60">
        <Save size={15} /> {busy ? '…' : 'Save'}
      </button>
      <button onClick={remove} disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
        <Trash2 size={15} />
      </button>
      {status && <span className="text-sm text-slate-400">{status}</span>}
    </div>
  );
}

export default function StatsEditor() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminGetStats().then((s) => { setStats(s); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const upsert = (saved: Stat) =>
    setStats((list) => list.some((s) => s.id === saved.id)
      ? list.map((s) => (s.id === saved.id ? saved : s))
      : [...list, saved]);

  return (
    <div className="space-y-3">
      <button onClick={() => setDrafts((d) => [{ ...empty }, ...d])} className="btn-primary !py-2 text-sm">
        <Plus size={16} /> Add Stat
      </button>

      {drafts.map((d, i) => (
        <StatRow key={`draft-${i}`} initial={d}
          onSaved={(saved) => { upsert(saved); setDrafts((list) => list.filter((_, idx) => idx !== i)); }}
          onDeleted={() => setDrafts((list) => list.filter((_, idx) => idx !== i))} />
      ))}

      {!loaded && <p className="text-slate-500">Loading…</p>}

      {stats.map((s) => (
        <StatRow key={s.id} initial={{ ...s }}
          onSaved={upsert}
          onDeleted={(id) => setStats((list) => list.filter((x) => x.id !== id))} />
      ))}
    </div>
  );
}
