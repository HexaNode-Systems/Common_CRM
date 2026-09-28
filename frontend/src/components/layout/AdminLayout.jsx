import { useState, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { impersonating, exitImpersonation, user } = useAuth();

  return (
    <div
      className="min-h-screen overflow-x-clip bg-slate-100 font-theme text-slate-900"
      // Banner ki height: Sidebar aur Header isi ke neeche start hote hain
      style={{ '--banner-h': impersonating ? '2.5rem' : '0px' }}
    >
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {impersonating && (
        <div className="sticky top-0 z-50 flex h-10 items-center justify-center gap-3 bg-amber-600 px-3 text-sm font-bold text-white shadow-md sm:gap-4 sm:px-4">
          <span className="min-w-0 truncate">
            ⚠️ Impersonating <strong>{user?.name}</strong>
            <span className="hidden sm:inline"> ({user?.email})</span>
          </span>
          <button
            type="button"
            onClick={() => {
              exitImpersonation();
              window.location.href = '/super-admin';
            }}
            className="shrink-0 rounded-lg bg-white px-3 py-1 text-xs font-extrabold text-amber-700 shadow-sm transition hover:bg-amber-50"
          >
            Exit
          </button>
        </div>
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <div className={`min-h-screen transition-[padding] duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Header ko banner ke neeche chipkane wala wrapper (Header.jsx ko touch nahi karna pada) */}
        <div className="sticky top-[var(--banner-h,0px)] z-20">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        </div>
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}