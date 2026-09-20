import { useState } from 'react';
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
    <div className="min-h-screen overflow-x-hidden bg-slate-100 font-theme text-slate-900">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {impersonating && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-center text-sm font-bold flex items-center justify-center gap-4 z-50 sticky top-0 shadow-md animate-pulse">
          <span>
            ⚠️ Impersonation Active: Logged in as <strong>{user?.name}</strong> ({user?.email})
          </span>
          <button
            type="button"
            onClick={() => {
              exitImpersonation();
              window.location.href = '/super-admin';
            }}
            className="bg-white text-amber-700 hover:bg-amber-50 px-3 py-1 rounded-lg text-xs font-extrabold transition shadow-sm"
          >
            Exit Impersonation
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
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
