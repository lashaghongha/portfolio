import { useEffect, useState } from 'react';
import { Mail, Trash2, Check, CornerUpLeft } from 'lucide-react';
import type { ContactSubmission } from '../lib/api';
import { adminGetMessages, markMessageRead, deleteMessage } from '../lib/admin-api';

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  if (messages.length === 0) {
    return <p className="text-sm text-slate-500">No messages yet. Submissions from the contact form will appear here.</p>;
  }

  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm text-slate-400">
        {messages.length} message{messages.length === 1 ? '' : 's'}
        {unread > 0 && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-soft">{unread} new</span>}
      </p>

      {messages.map((m) => (
        <div key={m.id} className={`card-surface p-4 ${m.isRead ? '' : 'border-accent/40'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-white">{m.name}</span>
            <span className="text-xs text-slate-500">{when(m.createdAt)}</span>
          </div>
          <a href={`mailto:${m.email}`} className="text-sm text-accent-soft hover:text-white">{m.email}</a>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{m.message}</p>
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
              <span className="inline-flex items-center gap-1 text-xs text-amber-400/80">
                <Mail size={12} /> not emailed
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
