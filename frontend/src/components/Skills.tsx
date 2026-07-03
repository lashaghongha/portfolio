import { Code2 } from 'lucide-react';
import type { Skill } from '../lib/api';
import { useReveal } from '../hooks/useReveal';

export default function Skills({ skills }: { skills: Skill[] }) {
  const { ref, visible } = useReveal(0.1);

  if (!skills.length) return null;

  return (
    <section id="skills" className="container-px py-12">
      <div
        ref={ref}
        className={`card-surface flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:gap-10 ${
          visible ? 'animate-fade-up' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
            <Code2 size={20} />
          </span>
          <span className="whitespace-nowrap font-bold text-white">Tech Stack</span>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {skills.map((skill) => (
            <div key={skill.id} className="group flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-accent transition-transform duration-300 group-hover:scale-150" />
              <span className="text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                {skill.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
