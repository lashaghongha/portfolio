import { API_BASE, type Profile, type Project, type Skill, type Stat } from './api';

const TOKEN_KEY = 'portfolio_admin_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const isAuthed = (): boolean => !!getToken();
export const logout = (): void => localStorage.removeItem(TOKEN_KEY);

export async function login(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) throw new Error('Wrong password.');
  if (!res.ok) throw new Error('Login failed. Is the API running?');
  const data = (await res.json()) as { token: string };
  localStorage.setItem(TOKEN_KEY, data.token);
}

async function authed<T>(path: string, method: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(`Request failed (${res.status}).`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Resolve a possibly-relative upload path to an absolute URL for <img src>.
export const resolveAsset = (url: string | null): string | null =>
  !url ? null : url.startsWith('http') ? url : `${API_BASE}${url}`;

// ---- Profile ----
export const updateProfile = (p: Profile) => authed<Profile>('/api/admin/profile', 'PUT', p);

// ---- Projects ----
export const adminGetProjects = () => authed<Project[]>('/api/admin/projects', 'GET');
export const createProject = (p: Omit<Project, 'id'>) => authed<Project>('/api/admin/projects', 'POST', p);
export const updateProject = (id: number, p: Project) => authed<Project>(`/api/admin/projects/${id}`, 'PUT', p);
export const deleteProject = (id: number) => authed<void>(`/api/admin/projects/${id}`, 'DELETE');

// ---- Skills ----
export const adminGetSkills = () => authed<Skill[]>('/api/admin/skills', 'GET');
export const createSkill = (s: Omit<Skill, 'id'>) => authed<Skill>('/api/admin/skills', 'POST', s);
export const updateSkill = (id: number, s: Skill) => authed<Skill>(`/api/admin/skills/${id}`, 'PUT', s);
export const deleteSkill = (id: number) => authed<void>(`/api/admin/skills/${id}`, 'DELETE');

// ---- Stats ----
export const adminGetStats = () => authed<Stat[]>('/api/admin/stats', 'GET');
export const createStat = (s: Omit<Stat, 'id'>) => authed<Stat>('/api/admin/stats', 'POST', s);
export const updateStat = (id: number, s: Stat) => authed<Stat>(`/api/admin/stats/${id}`, 'PUT', s);
export const deleteStat = (id: number) => authed<void>(`/api/admin/stats/${id}`, 'DELETE');

// ---- Image upload ----
export async function uploadImage(file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/admin/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new Error(problem?.error ?? 'Upload failed.');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
