import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, LogIn } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16 text-center font-theme">
      <Helmet>
        <title>404 - Page Not Found | Appnix CRM Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="mx-auto max-w-md space-y-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-indigo-50 text-primary border border-indigo-100 shadow-sm text-3xl font-black">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            The page you are looking for does not exist, was removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:brightness-105 transition"
          >
            <Home size={18} />
            Back to Homepage
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <LogIn size={18} />
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
