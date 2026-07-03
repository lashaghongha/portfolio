export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5257';

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  githubUrl: string;
  linkedInUrl: string;
  email: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  icon: string;
  accent: string;
  tags: string[];
  imageUrl: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  sortOrder: number;
}

export interface Skill {
  id: number;
  name: string;
  icon: string;
  category: string;
  sortOrder: number;
}

export interface Stat {
  id: number;
  label: string;
  value: string;
  icon: string;
  sortOrder: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getProfile = () => getJson<Profile>('/api/profile');
export const getStats = () => getJson<Stat[]>('/api/stats');
export const getProjects = () => getJson<Project[]>('/api/projects');
export const getSkills = () => getJson<Skill[]>('/api/skills');

export interface ContactResult {
  success: boolean;
  message: string;
}

export async function sendContact(payload: ContactPayload): Promise<ContactResult> {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 400) {
    const problem = await res.json().catch(() => null);
    const firstError = problem?.errors
      ? (Object.values(problem.errors)[0] as string[])?.[0]
      : 'Please check your input.';
    throw new Error(firstError ?? 'Validation failed.');
  }

  if (!res.ok) throw new Error('Something went wrong. Please try again.');
  return res.json() as Promise<ContactResult>;
}
