import { Briefcase, GraduationCap } from 'lucide-react';
import type { ExperienceItem } from '../lib/api';
import { useReveal } from '../hooks/useReveal';

function Timeline({ title, icon: Icon, items }: { title: string; icon: typeof Briefcase; items: ExperienceItem[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
          <Icon size={18} />
        </span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>

      <ol className="relative ml-1 border-l border-line">
        {items.map((item) => (
          <li key={item.id} className="relative pb-7 pl-6 last:pb-0">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-bg" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h4 className="font-semibold text-white">{item.title}</h4>
              {item.period && <span className="text-xs font-medium text-accent-soft">{item.period}</span>}
            </div>
            {item.organization && <p className="mt-0.5 text-sm text-slate-400">{item.organization}</p>}
            {item.description && <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Experience({ items }: { items: ExperienceItem[] }) {
  const { ref, visible } = useReveal(0.1);

  if (!items.length) return null;

  const work = items.filter((i) => i.kind !== 'education');
  const education = items.filter((i) => i.kind === 'education');

  return (
    <section id="experience" className="container-px py-16 sm:py-20">
      <div ref={ref} className={visible ? 'animate-fade-up' : 'opacity-0'}>
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-soft">
            <Briefcase size={15} /> My Journey
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Experience &amp; <span className="gradient-text">Education</span>
          </h2>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <Timeline title="Experience" icon={Briefcase} items={work} />
          <Timeline title="Education" icon={GraduationCap} items={education} />
        </div>
      </div>
    </section>
  );
}
