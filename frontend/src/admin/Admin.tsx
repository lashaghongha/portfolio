import { useState } from 'react';
import { isAuthed } from '../lib/admin-api';
import Login from './Login';
import Dashboard from './Dashboard';

export default function Admin() {
  const [authed, setAuthed] = useState(isAuthed());

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}
