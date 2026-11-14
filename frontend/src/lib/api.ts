export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5257';

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  about: string;
  photoUrl: string | null;
  cvUrl: string | null;
  location: string;
  githubUrl: string;
  linkedInUrl: string;
  email: string;
}

export interface GalleryItem {
  url: string;
  caption?: string | null;
  group?: string | null;
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  icon: string;
  accent: string;
  tags: string[];
  imageUrl: string | null;
  gallery: GalleryItem[];
  specs: SpecRow[];
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

export interface ExperienceItem {
  id: number;
  kind: string; // "work" | "education"
  title: string;
  organization: string;
  period: string;
  description: string;
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
export const getProject = (id: number) => getJson<Project>(`/api/projects/${id}`);
export const getSkills = () => getJson<Skill[]>('/api/skills');
export const getExperience = () => getJson<ExperienceItem[]>('/api/experience');

export interface ViewCounter {
  id: number;
  key: string;
  count: number;
  updatedAt: string;
}

export interface ViewEvent {
  id: number;
  key: string;
  startedAt: string;
  durationMs: number;
  cvViewed: boolean;
  cvDownloaded: boolean;
}

export interface AnalyticsResult {
  counters: ViewCounter[];
  recent: ViewEvent[];
  cvDownloads: number;
  cvViews: number;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  emailed: boolean;
  emailError?: string | null;
}

export interface EmailTestResult {
  configured: boolean;
  ok: boolean;
  error: string | null;
}

// Fire-and-forget view tracking; counted at most once per browser session per key.
export function trackView(key: string): void {
  try {
    const flag = `tracked:${key}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, '1');
  } catch {
    // sessionStorage unavailable (private mode) — still track, just not deduped.
  }
  fetch(`${API_BASE}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
    keepalive: true,
  }).catch(() => {});
}

// Only allow safe schemes for user-editable links (guards against javascript:/data: URLs).
export function safeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return url;
  } catch {
    return undefined;
  }
  return undefined;
}

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
