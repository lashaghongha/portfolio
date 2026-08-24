import { useState, useEffect } from 'react';
import { isAuthed, checkSession } from '../lib/admin-api';
import Login from './Login';
import Dashboard from './Dashboard';

export default function Admin() {
  const [authed, setAuthed] = useState(isAuthed());
  const [checking, setChecking] = useState(!isAuthed());

  // If no local Bearer token, the operator may have arrived via the hub tile,
  // which set an httpOnly admin_token cookie. Probe the cookie session before
  // falling back to the manual password login.
  useEffect(() => {
    if (isAuthed()) return;
    let cancelled = false;
    checkSession()
      .then((ok) => { if (!cancelled && ok) setAuthed(true); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  if (checking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#9ca3af', fontFamily: 'sans-serif' }}>Loading…</div>;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}
