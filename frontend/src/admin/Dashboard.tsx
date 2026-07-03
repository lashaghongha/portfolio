import { useState } from 'react';
import { LogOut, User, FolderGit2, Wrench, BarChart3, ExternalLink } from 'lucide-react';
import { logout } from '../lib/admin-api';
import ProfileEditor from './ProfileEditor';
import ProjectsEditor from './ProjectsEditor';
import SkillsEditor from './SkillsEditor';
import StatsEditor from './StatsEditor';

type Tab = 'profile' | 'projects' | 'skills' | 'stats';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('profile');

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Portfolio Admin</h1>
            <p className="text-xs text-slate-500">Manage your site content</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="btn-ghost !py-1.5 text-xs">
              <ExternalLink size={13} /> View site
            </a>
            <button onClick={handleLogout} className="btn-ghost !py-1.5 text-xs">
              <LogOut size={13} /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <nav className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                tab === id ? 'border-accent/50 bg-accent/10 text-accent-soft' : 'border-line text-slate-400 hover:text-white'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        {tab === 'profile' && <ProfileEditor />}
        {tab === 'projects' && <ProjectsEditor />}
        {tab === 'skills' && <SkillsEditor />}
        {tab === 'stats' && <StatsEditor />}
      </div>
    </div>
  );
}
