import { Link } from 'react-router-dom';
import { ArrowLeft, Ghost } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow">
          <Ghost size={30} />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent-soft">404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link to="/" className="btn-primary mt-8">
          <ArrowLeft size={16} /> Back home
        </Link>
      </div>
    </div>
  );
}
