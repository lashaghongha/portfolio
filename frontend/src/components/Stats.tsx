import type { Stat } from '../lib/api';
import { resolveIcon } from '../lib/icons';
import { useReveal } from '../hooks/useReveal';

export default function Stats({ stats }: { stats: Stat[] }) {
  const { ref, visible } = useReveal();

  if (!stats.length) return null;

  return (
    <section id="about" className="container-px py-8">
      <div
        ref={ref}
        className={`card-surface grid grid-cols-2 divide-x divide-y divide-line overflow-hidden sm:grid-cols-4 sm:divide-y-0 ${
          visible ? 'animate-fade-up' : 'opacity-0'
        }`}
      >
        {stats.map((stat) => {
          const Icon = resolveIcon(stat.icon);
          return (
            <div key={stat.label} className="flex flex-col gap-1 p-6">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-accent-soft" />
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
