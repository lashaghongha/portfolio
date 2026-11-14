import { MapPin, Briefcase, BadgeCheck, Download, Eye, User } from 'lucide-react';
import type { Profile } from '../lib/api';
import { resolveAsset } from '../lib/admin-api';
import { getInitials, cvDownloadName } from '../lib/profile';
import { trackCv } from '../lib/analytics';
import { useReveal } from '../hooks/useReveal';

const DEFAULT_ABOUT =
  'Full Stack Developer crafting modern, responsive and user-friendly web applications with clean code and great design.';

export default function About({ profile }: { profile: Profile | null }) {
  const { ref, visible } = useReveal(0.1);

  const text = (profile?.about || profile?.bio || DEFAULT_ABOUT).trim();
  const paragraphs = text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const photo = resolveAsset(profile?.photoUrl ?? null);
  const cv = resolveAsset(profile?.cvUrl ?? null);
  const initials = getInitials(profile?.name);

  const facts = [
    profile?.location && { icon: MapPin, label: profile.location },
    profile?.role && { icon: Briefcase, label: profile.role },
    { icon: BadgeCheck, label: 'Available for work' },
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  return (
    <section id="about" className="container-px py-16 sm:py-20">
      <div
        ref={ref}
        className={`grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16 ${
          visible ? 'animate-fade-up' : 'opacity-0'
        }`}
      >
        {/* Photo / avatar with layered glow */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 rounded-[2rem] bg-accent/20 blur-3xl" aria-hidden />
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-2xl border border-accent/30 bg-accent/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full border border-accent/20"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-bg-elevated shadow-card">
            <div className="aspect-[4/5] w-full">
              {photo ? (
                <img src={photo} alt={profile?.name ?? 'Profile photo'} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent-glow/20 to-bg-soft">
                  <span className="flex flex-col items-center gap-3 text-slate-500">
                    <span className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-accent-glow to-accent text-3xl font-black text-white shadow-glow">
                      {initials}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <User size={13} /> Add a photo in the admin panel
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-soft">
            <User size={15} /> About Me
          </span>

          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            A bit <span className="gradient-text">about me</span>
          </h2>

          <div className="mt-5 space-y-4 text-lg leading-relaxed text-slate-400">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {facts.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-4 py-2 text-sm text-slate-300"
              >
                <Icon size={16} className="text-accent-soft" /> {label}
              </span>
            ))}
          </div>

          {cv && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={cv}
                target="_blank"
                rel="noopener noreferrer"
                download={cvDownloadName(profile?.name)}
                onClick={() => trackCv('download')}
                className="group inline-flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 py-2.5 pl-2.5 pr-5 text-white transition-colors hover:border-accent/60 hover:bg-accent/15"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow transition-transform group-hover:-translate-y-0.5">
                  <Download size={18} />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">Download CV</span>
                  <span className="text-xs text-slate-400">PDF · résumé</span>
                </span>
              </a>
              <a
                href={cv}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCv('view')}
                className="inline-flex items-center gap-2 self-stretch rounded-2xl border border-line bg-white/[0.02] px-5 text-sm font-medium text-slate-300 transition-colors hover:border-accent/50 hover:text-white"
              >
                <Eye size={16} /> View in browser
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
