import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../lib/brand-icons';
import type { Profile } from '../lib/api';

const links = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ profile }: { profile: Profile | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-line bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="container-px flex h-16 items-center justify-between" aria-label="Main navigation">
        <a href="#home" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent font-black text-white shadow-glow">
            MG
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-bold text-white">{profile?.name ?? 'Mate G.'}</span>
            <span className="text-xs text-slate-500">{profile?.role ?? 'Full Stack Developer'}</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={profile?.githubUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white/[0.02] text-slate-400 transition-colors hover:border-accent/50 hover:text-white"
          >
            <GithubIcon size={16} />
          </a>
          <a
            href={profile?.linkedInUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white/[0.02] text-slate-400 transition-colors hover:border-accent/50 hover:text-white"
          >
            <LinkedinIcon size={16} />
          </a>
          <a href="#contact" className="btn-primary hidden !px-5 !py-2 text-sm sm:inline-flex">
            Let&apos;s Talk
          </a>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-300 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg/95 backdrop-blur-xl md:hidden">
          <ul className="container-px flex flex-col py-4">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-sm font-medium text-slate-300 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
