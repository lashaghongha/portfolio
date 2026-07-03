import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import {
  getProfile,
  getStats,
  getProjects,
  getSkills,
  type Profile,
  type Stat,
  type Project,
  type Skill,
} from './lib/api';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getProfile(), getStats(), getProjects(), getSkills()])
      .then(([p, s, pr, sk]) => {
        if (!active) return;
        setProfile(p);
        setStats(s);
        setProjects(pr);
        setSkills(sk);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <main>
        <Hero profile={profile} />
        <Projects projects={projects} />
        <Stats stats={stats} />
        <Skills skills={skills} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />

      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/80 px-4 py-2 text-sm text-red-300 backdrop-blur">
          Couldn&apos;t reach the API. Make sure the .NET backend is running on port 5257.
        </div>
      )}
    </div>
  );
}
