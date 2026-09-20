import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 text-center">
      <Helmet>
        <title>Access Denied | Appnix CRM Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100 dark:bg-red-950/20 dark:text-red-400 dark:ring-red-900/30 animate-bounce">
        <ShieldAlert size={40} />
      </div>
      
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Access Denied
      </h1>
      
      <p className="mt-3 max-w-md text-base text-slate-500 dark:text-slate-400">
        You do not have the required permissions to view this module. If you believe this is an error, please contact your administrator to adjust your role privileges.
      </p>
      
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-theme border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Go Back
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-theme bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:brightness-105"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
