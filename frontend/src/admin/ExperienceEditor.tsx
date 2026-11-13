import { useEffect, useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import type { ExperienceItem } from '../lib/api';
import { adminGetExperience, createExperience, updateExperience, deleteExperience } from '../lib/admin-api';
import { Field, TextInput, TextArea } from './ui';

type Draft = Omit<ExperienceItem, 'id'> & { id: number | null };

const empty: Draft = { id: null, kind: 'work', title: '', organization: '', period: '', description: '', sortOrder: 0 };

function Row({ initial, onSaved, onDeleted }: {
  initial: Draft; onSaved: (e: ExperienceItem) => void; onDeleted: (id: number | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setBusy(true); setStatus('');
    try {
      const saved = draft.id == null
        ? await createExperience(draft)
        : await updateExperience(draft.id, { ...draft, id: draft.id });
      onSaved(saved);
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (draft.id == null) { onDeleted(null); return; }
    if (!confirm(`Delete "${draft.title}"?`)) return;
    setBusy(true);
    try { await deleteExperience(draft.id); onDeleted(draft.id); }
    catch (err) { setStatus(err instanceof Error ? err.message : 'Delete failed.'); setBusy(false); }
  }

  return (
    <div className="card-surface space-y-3 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Type">
          <select value={draft.kind} onChange={(e) => set({ kind: e.target.value })}
            className="rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-white outline-none focus:border-accent/60">
            <option value="work">Work</option>
            <option value="education">Education</option>
          </select>
        </Field>
        <Field label="Title / Role"><TextInput value={draft.title} onChange={(e) => set({ title: e.target.value })} className="w-56" /></Field>
        <Field label="Organization"><TextInput value={draft.organization} onChange={(e) => set({ organization: e.target.value })} className="w-48" /></Field>
        <Field label="Period"><TextInput value={draft.period} onChange={(e) => set({ period: e.target.value })} placeholder="2023 — Present" className="w-40" /></Field>
        <Field label="Order"><TextInput type="number" value={draft.sortOrder}
          onChange={(e) => set({ sortOrder: Number(e.target.value) })} className="w-20" /></Field>
      </div>
      <Field label="Description"><TextArea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={2} /></Field>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary !py-2 text-sm disabled:opacity-60">
          <Save size={15} /> {busy ? '…' : 'Save'}
        </button>
        <button onClick={remove} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
          <Trash2 size={15} />
        </button>
        {status && <span className="text-sm text-slate-400">{status}</span>}
      </div>
    </div>
  );
}

export default function ExperienceEditor() {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminGetExperience().then((e) => { setItems(e); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const upsert = (saved: ExperienceItem) =>
    setItems((list) => list.some((e) => e.id === saved.id)
      ? list.map((e) => (e.id === saved.id ? saved : e))
      : [...list, saved]);

  return (
    <div className="space-y-3">
      <button onClick={() => setDrafts((d) => [{ ...empty }, ...d])} className="btn-primary !py-2 text-sm">
        <Plus size={16} /> Add Entry
      </button>

      {drafts.map((d, i) => (
        <Row key={`draft-${i}`} initial={d}
          onSaved={(saved) => { upsert(saved); setDrafts((list) => list.filter((_, idx) => idx !== i)); }}
          onDeleted={() => setDrafts((list) => list.filter((_, idx) => idx !== i))} />
      ))}

      {!loaded && <p className="text-slate-500">Loading…</p>}

      {items.map((e) => (
        <Row key={e.id} initial={{ ...e }}
          onSaved={upsert}
          onDeleted={(id) => setItems((list) => list.filter((x) => x.id !== id))} />
      ))}
    </div>
  );
}
