import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import CursorGlow from './components/CursorGlow';
import Hero from './components/Hero';
import About from './components/About';
import Stats from './components/Stats';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import {
  getProfile,
  getStats,
  getProjects,
  getSkills,
  getExperience,
  type Profile,
  type Stat,
  type Project,
  type Skill,
  type ExperienceItem,
} from './lib/api';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getProfile(), getStats(), getProjects(), getSkills(), getExperience()])
      .then(([p, s, pr, sk, ex]) => {
        if (!active) return;
        setProfile(p);
        setStats(s);
        setProjects(pr);
        setSkills(sk);
        setExperience(ex);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  // Keep the document title / description in sync with the live profile.
  useEffect(() => {
    if (!profile) return;
    const name = profile.name?.trim() || 'Lasha Ghonghadze';
    const role = profile.role?.trim() || 'Full Stack Developer';
    document.title = `${name} — ${role}`;
    const desc = profile.bio?.trim() || `${role} building modern web applications.`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  }, [profile]);

  return (
    <div className="relative min-h-screen">
      <CursorGlow />
      <div className="relative z-10">
        <Navbar profile={profile} />
        <main>
          <Hero profile={profile} />
          <About profile={profile} />
          <Stats stats={stats} />
          <Projects projects={projects} />
          <Experience items={experience} />
          <Skills skills={skills} />
          <Contact profile={profile} />
        </main>
        <Footer profile={profile} />
      </div>

      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/80 px-4 py-2 text-sm text-red-300 backdrop-blur">
          Couldn&apos;t reach the API. Make sure the .NET backend is running on port 5257.
        </div>
      )}
    </div>
  );
}
