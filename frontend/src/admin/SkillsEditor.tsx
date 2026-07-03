import { useEffect, useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import type { Skill } from '../lib/api';
import { adminGetSkills, createSkill, updateSkill, deleteSkill } from '../lib/admin-api';
import { Field, TextInput } from './ui';

type Draft = Omit<Skill, 'id'> & { id: number | null };

const empty: Draft = { id: null, name: '', icon: 'code', category: 'Frontend', sortOrder: 0 };

function SkillRow({ initial, onSaved, onDeleted }: {
  initial: Draft; onSaved: (s: Skill) => void; onDeleted: (id: number | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setBusy(true); setStatus('');
    try {
      const saved = draft.id == null
        ? await createSkill(draft)
        : await updateSkill(draft.id, { ...draft, id: draft.id });
      onSaved(saved);
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (draft.id == null) { onDeleted(null); return; }
    if (!confirm(`Delete "${draft.name}"?`)) return;
    setBusy(true);
    try { await deleteSkill(draft.id); onDeleted(draft.id); }
    catch (err) { setStatus(err instanceof Error ? err.message : 'Delete failed.'); setBusy(false); }
  }

  return (
    <div className="card-surface flex flex-wrap items-end gap-3 p-4">
      <Field label="Name"><TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} className="w-40" /></Field>
      <Field label="Icon (lucide)"><TextInput value={draft.icon} onChange={(e) => set({ icon: e.target.value })} className="w-36" /></Field>
      <Field label="Category"><TextInput value={draft.category} onChange={(e) => set({ category: e.target.value })} className="w-36" /></Field>
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

export default function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminGetSkills().then((s) => { setSkills(s); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const upsert = (saved: Skill) =>
    setSkills((list) => list.some((s) => s.id === saved.id)
      ? list.map((s) => (s.id === saved.id ? saved : s))
      : [...list, saved]);

  return (
    <div className="space-y-3">
      <button onClick={() => setDrafts((d) => [{ ...empty }, ...d])} className="btn-primary !py-2 text-sm">
        <Plus size={16} /> Add Skill
      </button>

      {drafts.map((d, i) => (
        <SkillRow key={`draft-${i}`} initial={d}
          onSaved={(saved) => { upsert(saved); setDrafts((list) => list.filter((_, idx) => idx !== i)); }}
          onDeleted={() => setDrafts((list) => list.filter((_, idx) => idx !== i))} />
      ))}

      {!loaded && <p className="text-slate-500">Loading…</p>}

      {skills.map((s) => (
        <SkillRow key={s.id} initial={{ ...s }}
          onSaved={upsert}
          onDeleted={(id) => setSkills((list) => list.filter((x) => x.id !== id))} />
      ))}
    </div>
  );
}
