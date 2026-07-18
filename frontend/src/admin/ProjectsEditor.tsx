import { useEffect, useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import type { Project } from '../lib/api';
import {
  adminGetProjects, createProject, updateProject, deleteProject,
} from '../lib/admin-api';
import { Field, TextInput, TextArea, Toggle, Section } from './ui';
import ImageUploader from './ImageUploader';
import GalleryUploader from './GalleryUploader';
import SpecsEditor from './SpecsEditor';

type Draft = Omit<Project, 'id'> & { id: number | null };

const empty: Draft = {
  id: null, title: '', description: '', icon: 'sparkles', accent: 'violet',
  tags: [], imageUrl: null, gallery: [], specs: [], repoUrl: '', liveUrl: '', featured: true, sortOrder: 0,
};

const accents = ['violet', 'blue', 'green', 'orange'];

function ProjectCard({ initial, onSaved, onDeleted }: {
  initial: Draft; onSaved: (p: Project) => void; onDeleted: (id: number | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setBusy(true); setStatus('');
    const payload = { ...draft, tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      const saved = draft.id == null
        ? await createProject(payload)
        : await updateProject(draft.id, { ...payload, id: draft.id });
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
    try { await deleteProject(draft.id); onDeleted(draft.id); }
    catch (err) { setStatus(err instanceof Error ? err.message : 'Delete failed.'); setBusy(false); }
  }

  return (
    <div className="card-surface p-5">
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <Section title="Cover image" hint="16:9">
          <ImageUploader value={draft.imageUrl} onChange={(url) => set({ imageUrl: url })} />
        </Section>

        <div className="space-y-4">
          <Section title="Basics">
            <div className="space-y-3">
              <Field label="Title"><TextInput value={draft.title} onChange={(e) => set({ title: e.target.value })} /></Field>
              <Field label="Description"><TextArea value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
              <Field label="Tags (comma separated)"><TextInput value={tagsText} onChange={(e) => setTagsText(e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Links">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Repo URL"><TextInput value={draft.repoUrl ?? ''} onChange={(e) => set({ repoUrl: e.target.value })} /></Field>
              <Field label="Live URL"><TextInput value={draft.liveUrl ?? ''} onChange={(e) => set({ liveUrl: e.target.value })} /></Field>
            </div>
          </Section>

          <Section title="Appearance">
            <div className="flex flex-wrap items-center gap-3">
              <Field label="Icon (lucide name)"><TextInput value={draft.icon} onChange={(e) => set({ icon: e.target.value })} /></Field>
              <Field label="Accent">
                <select value={draft.accent} onChange={(e) => set({ accent: e.target.value })}
                  className="rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-white outline-none focus:border-accent/60">
                  {accents.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Order"><TextInput type="number" value={draft.sortOrder}
                onChange={(e) => set({ sortOrder: Number(e.target.value) })} className="w-20" /></Field>
              <div className="pt-5"><Toggle checked={draft.featured} onChange={(v) => set({ featured: v })} label="Featured" /></div>
            </div>
          </Section>
        </div>
      </div>

      <div className="mt-4">
        <Section title="Gallery" hint="Extra screenshots shown on the project detail page">
          <GalleryUploader value={draft.gallery} onChange={(gallery) => set({ gallery })} />
        </Section>
      </div>

      <div className="mt-4">
        <Section title="Tech stack" hint="Rows rendered as a table on the project detail page">
          <SpecsEditor value={draft.specs} onChange={(specs) => set({ specs })} />
        </Section>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
        <button onClick={save} disabled={busy} className="btn-primary !py-2 text-sm disabled:opacity-60">
          <Save size={15} /> {busy ? 'Saving…' : 'Save'}
        </button>
        <button onClick={remove} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
          <Trash2 size={15} /> Delete
        </button>
        {status && <span className="text-sm text-slate-400">{status}</span>}
      </div>
    </div>
  );
}

export default function ProjectsEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminGetProjects().then((p) => { setProjects(p); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const upsert = (saved: Project) =>
    setProjects((list) => list.some((p) => p.id === saved.id)
      ? list.map((p) => (p.id === saved.id ? saved : p))
      : [...list, saved]);

  return (
    <div className="space-y-4">
      <button onClick={() => setDrafts((d) => [{ ...empty }, ...d])} className="btn-primary !py-2 text-sm">
        <Plus size={16} /> Add Project
      </button>

      {drafts.map((d, i) => (
        <ProjectCard key={`draft-${i}`} initial={d}
          onSaved={(saved) => { upsert(saved); setDrafts((list) => list.filter((_, idx) => idx !== i)); }}
          onDeleted={() => setDrafts((list) => list.filter((_, idx) => idx !== i))} />
      ))}

      {!loaded && <p className="text-slate-500">Loading…</p>}

      {projects.map((p) => (
        <ProjectCard key={p.id} initial={{ ...p }}
          onSaved={upsert}
          onDeleted={(id) => setProjects((list) => list.filter((x) => x.id !== id))} />
      ))}
    </div>
  );
}
