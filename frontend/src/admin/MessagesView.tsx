import { useEffect, useState } from 'react';
import { Mail, Trash2, Check, CornerUpLeft, Send, Loader2 } from 'lucide-react';
import type { ContactSubmission } from '../lib/api';
import { adminGetMessages, markMessageRead, deleteMessage, emailTest } from '../lib/admin-api';

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EmailTester() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>('');
  const [ok, setOk] = useState<boolean | null>(null);

  async function run() {
    setBusy(true);
    setResult('');
    setOk(null);
    try {
      const r = await emailTest();
      setOk(r.ok);
      if (r.ok) setResult('Test email sent — check your inbox.');
      else if (!r.configured) setResult(r.error ?? 'SMTP not configured.');
      else setResult(`Failed: ${r.error ?? 'unknown error'}`);
    } catch (err) {
      setOk(false);
      setResult(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-surface flex flex-wrap items-center gap-3 p-4">
      <button onClick={run} disabled={busy} className="btn-ghost !py-2 text-sm disabled:opacity-60">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send test email
      </button>
      {result && (
        <span className={`text-sm ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>{result}</span>
      )}
      <span className="w-full text-xs text-slate-600">
        Checks your SMTP setup and shows the exact error if it fails.
      </span>
    </div>
  );
}

export default function MessagesView() {
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [status, setStatus] = useState('Loading…');

  useEffect(() => {
    adminGetMessages()
      .then((m) => { setMessages(m); setStatus(''); })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'Failed to load.'));
  }, []);

  async function read(id: number) {
    try {
      const saved = await markMessageRead(id);
      setMessages((list) => list.map((m) => (m.id === id ? saved : m)));
    } catch { /* ignore */ }
  }

  async function remove(id: number) {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(id);
      setMessages((list) => list.filter((m) => m.id !== id));
    } catch { /* ignore */ }
  }

  if (status) return <p className="text-slate-500">{status}</p>;

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="max-w-2xl space-y-3">
      <EmailTester />

      {messages.length === 0 && (
        <p className="text-sm text-slate-500">No messages yet. Submissions from the contact form will appear here.</p>
      )}

      {messages.length > 0 && (
        <p className="text-sm text-slate-400">
          {messages.length} message{messages.length === 1 ? '' : 's'}
          {unread > 0 && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-soft">{unread} new</span>}
        </p>
      )}

      {messages.map((m) => (
        <div key={m.id} className={`card-surface p-4 ${m.isRead ? '' : 'border-accent/40'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-white">{m.name}</span>
            <span className="text-xs text-slate-500">{when(m.createdAt)}</span>
          </div>
          <a href={`mailto:${m.email}`} className="text-sm text-accent-soft hover:text-white">{m.email}</a>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{m.message}</p>
          {m.emailError && (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-xs leading-relaxed text-amber-300">
              Email error: {m.emailError}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <a href={`mailto:${m.email}?subject=Re: your message`} className="btn-ghost !py-1.5 text-xs">
              <CornerUpLeft size={13} /> Reply
            </a>
            {!m.isRead && (
              <button onClick={() => read(m.id)} className="btn-ghost !py-1.5 text-xs">
                <Check size={13} /> Mark read
              </button>
            )}
            {!m.emailed && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400/80" title={m.emailError ?? 'Email not sent (SMTP not configured or still sending).'}>
                <Mail size={12} /> not emailed{m.emailError ? ' ⚠' : ''}
              </span>
            )}
            <button
              onClick={() => remove(m.id)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
