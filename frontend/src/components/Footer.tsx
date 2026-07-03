import { Mail } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../lib/brand-icons';
import type { Profile } from '../lib/api';

export default function Footer({ profile }: { profile: Profile | null }) {
  return (
    <footer className="border-t border-line">
      <div className="container-px flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent-glow to-accent font-black text-white">
            MG
          </span>
          <span className="text-sm text-slate-500">
            © {new Date().getFullYear()} {profile?.name ?? 'Mate G.'}. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={profile?.githubUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate-400 transition-colors hover:border-accent/50 hover:text-white"
          >
            <GithubIcon size={16} />
          </a>
          <a
            href={profile?.linkedInUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate-400 transition-colors hover:border-accent/50 hover:text-white"
          >
            <LinkedinIcon size={16} />
          </a>
          <a
            href={`mailto:${profile?.email ?? ''}`}
            aria-label="Email"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate-400 transition-colors hover:border-accent/50 hover:text-white"
          >
            <Mail size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
