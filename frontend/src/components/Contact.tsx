import { useState, type FormEvent } from 'react';
import { Send, Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { sendContact, type Profile } from '../lib/api';
import { useReveal } from '../hooks/useReveal';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function Contact({ profile }: { profile: Profile | null }) {
  const { ref, visible } = useReveal(0.1);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setFeedback('');
    try {
      const result = await sendContact(form);
      setStatus('success');
      setFeedback(result.message);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-bg-soft px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-accent/60 focus:bg-white/[0.03]';

  return (
    <section id="contact" className="container-px py-20">
      <div
        ref={ref}
        className={`card-surface mx-auto max-w-2xl p-8 ${visible ? 'animate-fade-up' : 'opacity-0'}`}
      >
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-soft">
            <Mail size={15} /> Get In Touch
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white">Let&apos;s work together</h2>
          <p className="mt-2 text-slate-500">
            Have a project in mind? Send a message and I&apos;ll get back to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
              aria-label="Your name"
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              aria-label="Your email"
            />
          </div>
          <textarea
            className={`${inputClass} min-h-[140px] resize-y`}
            placeholder="Tell me about your project..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            minLength={5}
            aria-label="Your message"
          />

          <button type="submit" className="btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                Send Message <Send size={16} />
              </>
            )}
          </button>

          {status === 'success' && (
            <p className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={16} /> {feedback}
            </p>
          )}
          {status === 'error' && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={16} /> {feedback}
            </p>
          )}
        </form>

        {profile?.email && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Or email me directly at{' '}
            <a href={`mailto:${profile.email}`} className="text-accent-soft hover:text-white">
              {profile.email}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
