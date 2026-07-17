import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { GithubIcon } from '../lib/brand-icons';
import { getProject, safeUrl, type Project } from '../lib/api';
import { resolveIcon, accent } from '../lib/icons';
import { resolveAsset } from '../lib/admin-api';

type LoadState = 'loading' | 'loaded' | 'notfound' | 'error';

const GALLERY_PREVIEW_COUNT = 4;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      setState('notfound');
      return;
    }

    window.scrollTo(0, 0);
    let active = true;
    setState('loading');
    getProject(numericId)
      .then((p) => {
        if (!active) return;
        setProject(p);
        setState('loaded');
      })
      .catch((err: unknown) => {
        if (!active) return;
        const notFound = err instanceof Error && err.message.includes('404');
        setState(notFound ? 'notfound' : 'error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen">
      <header className="container-px py-6">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Back to projects
        </Link>
      </header>

      <main className="container-px pb-24">
        {state === 'loading' && (
          <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
            <Loader2 className="animate-spin" size={28} />
          </div>
        )}

        {(state === 'notfound' || state === 'error') && (
          <div className="mx-auto max-w-md py-24 text-center">
            <h1 className="text-3xl font-bold text-white">
              {state === 'notfound' ? 'Project not found' : 'Something went wrong'}
            </h1>
            <p className="mt-3 text-slate-400">
              {state === 'notfound'
                ? "This project doesn't exist or may have been removed."
                : "Couldn't load this project. Please try again."}
            </p>
            <Link to="/#projects" className="btn-primary mt-8">
              <ArrowLeft size={16} /> Back to projects
            </Link>
          </div>
        )}

        {state === 'loaded' && project && <ProjectView project={project} />}
      </main>
    </div>
  );
}

function ProjectView({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = resolveIcon(project.icon);
  const a = accent(project.accent);
  const image = resolveAsset(project.imageUrl);
  const repo = safeUrl(project.repoUrl);
  const live = safeUrl(project.liveUrl);
  const gallery = project.galleryUrls
    .map((url) => resolveAsset(url))
    .filter((src): src is string => Boolean(src));
  const hasMore = gallery.length > GALLERY_PREVIEW_COUNT;
  const visibleGallery = expanded ? gallery : gallery.slice(0, GALLERY_PREVIEW_COUNT);

  return (
    <article className="mx-auto max-w-4xl">
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-3xl border border-line bg-bg-soft sm:h-80">
        {image ? (
          <img src={image} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${a.from} ${a.to} opacity-10`} aria-hidden />
            <div className={`grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br ${a.from} ${a.to} text-white shadow-lg`}>
              <Icon size={44} />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {project.title}
        </h1>
        <div className="flex flex-wrap gap-3">
          {repo && (
            <a href={repo} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <GithubIcon size={16} /> Source
            </a>
          )}
          {live && (
            <a href={live} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Live site <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </div>

      {project.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-4 border-t border-line pt-8 text-lg leading-relaxed text-slate-300">
        {project.description
          .split(/\n{2,}/)
          .map((para) => para.trim())
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
      </div>

      {gallery.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Gallery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {visibleGallery.map((src, i) => (
              <div
                key={i}
                className="aspect-video overflow-hidden rounded-2xl border border-line bg-bg-soft"
              >
                <img
                  src={src}
                  alt={`${project.title} screenshot ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={() => setExpanded((v) => !v)} className="btn-ghost">
                {expanded ? 'View less' : `View more (${gallery.length - GALLERY_PREVIEW_COUNT})`}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
