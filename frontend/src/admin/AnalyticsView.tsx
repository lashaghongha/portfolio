import { useEffect, useState } from 'react';
import { Home, Eye, Download, Clock } from 'lucide-react';
import type { AnalyticsResult, Project } from '../lib/api';
import { adminGetAnalytics, adminGetProjects } from '../lib/admin-api';

function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Stat({ icon: Icon, value, label }: { icon: typeof Home; value: number; label: string }) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState('Loading…');

  useEffect(() => {
    Promise.all([adminGetAnalytics(), adminGetProjects()])
      .then(([a, p]) => {
        setData(a);
        setProjects(p);
        setStatus('');
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'Failed to load.'));
  }, []);

  if (status || !data) return <p className="text-slate-500">{status}</p>;

  const pageLabel = (key: string) => {
    if (key === 'home') return 'Home';
    const id = Number(key.split(':')[1]);
    return projects.find((p) => p.id === id)?.title ?? `Project #${id}`;
  };

  const home = data.counters.find((c) => c.key === 'home')?.count ?? 0;
  const projectTotal = data.counters.filter((c) => c.key.startsWith('project:')).reduce((n, c) => n + c.count, 0);

  return (
    <div className="max-w-3xl space-y-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Home} value={home} label="Home views" />
        <Stat icon={Eye} value={projectTotal} label="Project views" />
        <Stat icon={Download} value={data.cvDownloads} label="CV downloads" />
        <Stat icon={Eye} value={data.cvViews} label="CV opened" />
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-soft">
          <Clock size={13} /> Recent sessions
        </h3>
        {data.recent.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions tracked yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">When</th>
                  <th className="px-4 py-2.5 font-semibold">Page</th>
                  <th className="px-4 py-2.5 font-semibold">Time on page</th>
                  <th className="px-4 py-2.5 font-semibold">CV</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{when(e.startedAt)}</td>
                    <td className="px-4 py-2.5 text-slate-200">{pageLabel(e.key)}</td>
                    <td className="px-4 py-2.5 text-slate-400">{e.durationMs > 0 ? duration(e.durationMs) : '—'}</td>
                    <td className="px-4 py-2.5">
                      {e.cvDownloaded ? (
                        <span className="inline-flex items-center gap-1 text-accent-soft"><Download size={13} /> downloaded</span>
                      ) : e.cvViewed ? (
                        <span className="inline-flex items-center gap-1 text-accent-soft"><Eye size={13} /> opened</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600">
        Privacy-friendly — no cookies, IPs or personal data. Time on page is measured until the tab is
        closed or navigated away.
      </p>
    </div>
  );
}
