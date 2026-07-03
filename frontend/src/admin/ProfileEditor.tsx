import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { getProfile, type Profile } from '../lib/api';
import { updateProfile } from '../lib/admin-api';
import { Field, TextInput, TextArea } from './ui';

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setStatus('Failed to load profile.'));
  }, []);

  if (!profile) return <p className="text-slate-500">{status || 'Loading…'}</p>;

  const set = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch });

  async function save() {
    if (!profile) return;
    setBusy(true);
    setStatus('');
    try {
      const saved = await updateProfile(profile);
      setProfile(saved);
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><TextInput value={profile.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Role"><TextInput value={profile.role} onChange={(e) => set({ role: e.target.value })} /></Field>
      </div>
      <Field label="Tagline"><TextInput value={profile.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
      <Field label="Bio"><TextArea value={profile.bio} onChange={(e) => set({ bio: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GitHub URL"><TextInput value={profile.githubUrl} onChange={(e) => set({ githubUrl: e.target.value })} /></Field>
        <Field label="LinkedIn URL"><TextInput value={profile.linkedInUrl} onChange={(e) => set({ linkedInUrl: e.target.value })} /></Field>
      </div>
      <Field label="Email"><TextInput value={profile.email} onChange={(e) => set({ email: e.target.value })} /></Field>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          <Save size={16} /> {busy ? 'Saving…' : 'Save Profile'}
        </button>
        {status && <span className="text-sm text-slate-400">{status}</span>}
      </div>
    </div>
  );
}
