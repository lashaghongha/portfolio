import { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { login } from '../lib/admin-api';
import { TextInput } from './ui';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm card-surface p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
            <Lock size={20} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your password to manage the portfolio.</p>
        </div>

        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full justify-center disabled:opacity-60">
          {busy ? 'Signing in…' : (<>Sign In <LogIn size={16} /></>)}
        </button>
      </form>
    </div>
  );
}
