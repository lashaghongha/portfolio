import { useEffect, useState } from 'react';
import { Home, Eye } from 'lucide-react';
import type { ViewCounter, Project } from '../lib/api';
import { adminGetAnalytics, adminGetProjects } from '../lib/admin-api';

export default function AnalyticsView() {
  const [counters, setCounters] = useState<ViewCounter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState('Loading…');

  useEffect(() => {
    Promise.all([adminGetAnalytics(), adminGetProjects()])
      .then(([c, p]) => {
        setCounters(c);
        setProjects(p);
        setStatus('');
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'Failed to load.'));
  }, []);

  if (status) return <p className="text-slate-500">{status}</p>;

  const home = counters.find((c) => c.key === 'home')?.count ?? 0;
  const titleFor = (key: string) => {
    const id = Number(key.split(':')[1]);
    return projects.find((p) => p.id === id)?.title ?? `Project #${id}`;
  };
  const projectViews = counters
    .filter((c) => c.key.startsWith('project:'))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card-surface flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
          <Home size={22} />
        </span>
        <div>
          <p className="text-3xl font-bold text-white">{home.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Homepage views</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-soft">Project views</h3>
        {projectViews.length === 0 ? (
          <p className="text-sm text-slate-500">No project views tracked yet.</p>
        ) : (
          <div className="space-y-2">
            {projectViews.map((c) => (
              <div key={c.key} className="card-surface flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate text-sm font-medium text-slate-200">{titleFor(c.key)}</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                  <Eye size={14} /> {c.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600">
        Privacy-friendly counts only — no cookies, IPs or personal data. Counted once per visitor session.
      </p>
    </div>
  );
}
