import { ArrowRight, MessageCircle, Hand } from 'lucide-react';
import type { Profile } from '../lib/api';
import { DEFAULT_NAME } from '../lib/profile';

function CodeEditor() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-elevated/90 shadow-card backdrop-blur">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/90" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/90" />
            <span className="h-3 w-3 rounded-full bg-green-500/90" />
          </div>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            JavaScript <span className="h-2 w-2 rounded-full bg-yellow-400" />
          </span>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
          <code>
            <span className="text-slate-600">1  </span>
            <span className="text-purple-400">const</span> <span className="text-sky-300">developer</span>{' '}
            <span className="text-slate-400">= {'{'}</span>
            {'\n'}
            <span className="text-slate-600">2    </span>
            <span className="text-slate-300">name</span>
            <span className="text-slate-400">:</span> <span className="text-emerald-300">'Lasha Ghongha'</span>
            <span className="text-slate-400">,</span>
            {'\n'}
            <span className="text-slate-600">3    </span>
            <span className="text-slate-300">role</span>
            <span className="text-slate-400">:</span>{' '}
            <span className="text-emerald-300">'Full Stack Developer'</span>
            <span className="text-slate-400">,</span>
            {'\n'}
            <span className="text-slate-600">4    </span>
            <span className="text-slate-300">skills</span>
            <span className="text-slate-400">: [</span>
            <span className="text-emerald-300">'React'</span>
            <span className="text-slate-400">, </span>
            <span className="text-emerald-300">'Next.js'</span>
            <span className="text-slate-400">, </span>
            <span className="text-emerald-300">'Node.js'</span>
            <span className="text-slate-400">],</span>
            {'\n'}
            <span className="text-slate-600">5    </span>
            <span className="text-slate-300">passion</span>
            <span className="text-slate-400">:</span>{' '}
            <span className="text-emerald-300">'Building innovative solutions'</span>
            <span className="text-slate-400">,</span>
            {'\n'}
            <span className="text-slate-600">6  </span>
            <span className="text-slate-400">{'};'}</span>
            {'\n'}
            <span className="text-slate-600">7  </span>
            {'\n'}
            <span className="text-slate-600">8  </span>
            <span className="text-purple-400">function</span>{' '}
            <span className="text-yellow-300">createExperience</span>
            <span className="text-slate-400">() {'{'}</span>
            {'\n'}
            <span className="text-slate-600">9    </span>
            <span className="text-purple-400">return</span>{' '}
            <span className="text-emerald-300">'Clean code. Great design.'</span>
            <span className="text-slate-400">;</span>
            {'\n'}
            <span className="text-slate-600">10 </span>
            <span className="text-slate-400">{'}'}</span>
            <span className="animate-pulse text-accent">|</span>
          </code>
        </pre>
      </div>
    </div>
  );
}

export default function Hero({ profile }: { profile: Profile | null }) {
  const tagline = profile?.tagline ?? 'I build digital experiences that make an impact.';
  const parts = tagline.split(/(experiences)/i);

  return (
    <section id="home" className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="container-px grid items-center gap-12 pb-16 lg:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-soft">
            <Hand size={15} className="text-yellow-400" /> Hello, I&apos;m {profile?.name?.split(' ')[0] ?? DEFAULT_NAME.split(' ')[0]}
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {parts.map((part, i) =>
              /experiences/i.test(part) ? (
                <span key={i} className="gradient-text">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </h1>

          <p className="mt-6 max-w-md text-lg text-slate-400">
            {profile?.bio ??
              'Full Stack Developer crafting modern, responsive and user-friendly web applications.'}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#projects" className="btn-primary">
              View Projects <ArrowRight size={18} />
            </a>
            <a href="#contact" className="btn-ghost">
              Contact Me <MessageCircle size={18} />
            </a>
          </div>
        </div>

        <div className="animate-float">
          <CodeEditor />
        </div>
      </div>
    </section>
  );
}
