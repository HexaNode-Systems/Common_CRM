import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Shared wrapper for all legal pages so the dark background,
// spacing, and "back to home" link stay consistent everywhere.
export default function LegalPageLayout({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-slate-950 font-theme">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 border-b border-white/10 pb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </div>
  );
}