import { useEffect } from 'react';
import { API_BASE } from './api';

// Detailed per-session view tracking: when a page was opened, how long it was
// viewed, and whether the CV was opened or downloaded. Privacy-friendly — no
// cookies, IPs or personal data, just timing.

let currentId: number | null = null;
let startedAt = 0;
let ended = false;

function post(path: string, body: unknown, beacon = false) {
  const payload = JSON.stringify(body);
  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE}${path}`, new Blob([payload], { type: 'application/json' }));
      return;
    }
  } catch {
    // fall through to fetch
  }
  fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

async function startView(key: string) {
  try {
    const res = await fetch(`${API_BASE}/api/track/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { id: number };
    currentId = data.id;
    startedAt = performance.now();
    ended = false;
  } catch {
    // ignore
  }
}

function endView() {
  if (currentId == null || ended) return;
  ended = true;
  post('/api/track/end', { id: currentId, durationMs: Math.round(performance.now() - startedAt) }, true);
}

export function trackCv(action: 'view' | 'download') {
  if (currentId == null) return;
  post('/api/track/cv', { id: currentId, action });
}

// Track a page view for the lifetime of the component (dwell time included).
export function useViewTracking(key: string) {
  useEffect(() => {
    startView(key);
    const onHide = () => endView();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      endView();
    };
  }, [key]);
}
