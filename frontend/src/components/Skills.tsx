import { Code2 } from 'lucide-react';
import type { Skill } from '../lib/api';
import { useReveal } from '../hooks/useReveal';

export default function Skills({ skills }: { skills: Skill[] }) {
  const { ref, visible } = useReveal(0.1);

  if (!skills.length) return null;

  // Group by category, preserving first-appearance order.
  const order: string[] = [];
  const groups: Record<string, Skill[]> = {};
  for (const skill of skills) {
    const cat = skill.category?.trim() || 'Other';
    if (!groups[cat]) {
      groups[cat] = [];
      order.push(cat);
    }
    groups[cat].push(skill);
  }

  return (
    <section id="skills" className="container-px py-12">
      <div
        ref={ref}
        className={`card-surface p-6 sm:p-8 ${visible ? 'animate-fade-up' : 'opacity-0'}`}
      >
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
            <Code2 size={20} />
          </span>
          <span className="font-bold text-white">Tech Stack</span>
        </div>

        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((cat) => (
            <div key={cat}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-soft">{cat}</h3>
              <div className="flex flex-wrap gap-2">
                {groups[cat].map((skill) => (
                  <span
                    key={skill.id}
                    className="group inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-accent/40 hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent transition-transform duration-300 group-hover:scale-150" />
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
