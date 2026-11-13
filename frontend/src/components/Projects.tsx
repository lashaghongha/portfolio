import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../lib/api';
import { resolveIcon, accent } from '../lib/icons';
import { resolveAsset } from '../lib/admin-api';
import { useReveal } from '../hooks/useReveal';
import ProjectStickman from './ProjectStickman';

const MAX_CARD_TAGS = 3;

function ProjectCard({ project, peeking, peekSrc }: { project: Project; peeking: boolean; peekSrc: string | null }) {
  const Icon = resolveIcon(project.icon);
  const a = accent(project.accent);
  const image = resolveAsset(project.imageUrl);
  const visibleTags = project.tags.slice(0, MAX_CARD_TAGS);
  const extraTags = project.tags.length - visibleTags.length;

  return (
    <Link
      to={`/projects/${project.id}`}
      aria-label={`View ${project.title} details`}
      className={`group card-surface flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card ${a.ring}`}
    >
      <div className="relative mb-5 flex h-32 items-center justify-center overflow-hidden rounded-xl border border-line bg-bg-soft">
        {image ? (
          <img src={image} alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${a.from} ${a.to} opacity-10`} aria-hidden />
            <div
              className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${a.from} ${a.to} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon size={28} />
            </div>
          </>
        )}

        {/* The stickman "peeks" at the site: the cover crossfades to a real screenshot. */}
        {peekSrc && (
          <img
            src={peekSrc}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${peeking ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>

      <h3 className="text-lg font-bold text-white">{project.title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400 line-clamp-2">
        {project.description}
      </p>

      {visibleTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
          {extraTags > 0 && <span className="tag-chip">+{extraTags}</span>}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-medium text-slate-400 transition-colors group-hover:text-white">
          View details
        </span>
        <span
          className={`grid h-9 w-9 place-items-center rounded-full border border-line ${a.text} transition-all duration-300 group-hover:border-current`}
        >
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="card-surface flex h-full animate-pulse flex-col p-5" aria-hidden>
      <div className="mb-5 h-32 rounded-xl bg-white/[0.04]" />
      <div className="h-5 w-2/3 rounded bg-white/[0.05]" />
      <div className="mt-3 h-4 w-full rounded bg-white/[0.03]" />
      <div className="mt-2 h-4 w-5/6 rounded bg-white/[0.03]" />
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-16 rounded bg-white/[0.04]" />
        <div className="h-6 w-12 rounded bg-white/[0.04]" />
      </div>
      <div className="mt-5 h-px bg-line" />
      <div className="mt-4 h-4 w-24 rounded bg-white/[0.04]" />
    </div>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  const { ref: revealRef, visible } = useReveal(0.05);
  const gridRef = useRef<HTMLDivElement>(null);
  const [peekId, setPeekId] = useState<number | null>(null);

  // The grid needs both the reveal callback ref and a stable ref for measuring.
  const setGridRef = useCallback(
    (el: HTMLDivElement | null) => {
      revealRef(el);
      gridRef.current = el;
    },
    [revealRef],
  );

  return (
    <section id="projects" className="relative container-px py-16 sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" aria-hidden />
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-soft">
            <Sparkles size={15} /> Featured Work
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="mt-3 max-w-md text-slate-400">
            A selection of my recent work — from full-stack apps to polished frontends.
          </p>
        </div>
        <a href="#contact" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-soft hover:text-white">
          View All Projects <ArrowUpRight size={15} />
        </a>
      </div>

      <div
        ref={setGridRef}
        className={`relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${visible ? '' : 'opacity-0'}`}
      >
        {projects.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} data-project-card>
                <ProjectCardSkeleton />
              </div>
            ))
          : projects.map((project, i) => (
              <div
                key={project.id}
                data-project-card
                className={visible ? 'animate-fade-up' : ''}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <ProjectCard
                  project={project}
                  peeking={peekId === project.id}
                  peekSrc={resolveAsset(project.gallery?.[0]?.url ?? null)}
                />
              </div>
            ))}

        <ProjectStickman gridRef={gridRef} projects={projects} onPeek={setPeekId} />
      </div>
    </section>
  );
}
