import { useState, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ThemeModeProvider, useThemeMode } from '../../context/ThemeModeContext.jsx';
import '../../styles/admin.css';
import '../../styles/admin-bridge.css';
import Loader from '../Loader.jsx';

export default function AdminLayout() {
  return (
    <ThemeModeProvider>
      <AdminShell />
    </ThemeModeProvider>
  );
}

function AdminShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { impersonating, exitImpersonation, user } = useAuth();
  const { mode } = useThemeMode();

  return (
    <div data-mode={mode} className="ax-admin ax-themed min-h-screen overflow-x-hidden">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {impersonating && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-[#183c32] px-4 py-2 text-sm font-medium text-[#f5faf5]">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>
            Impersonating <strong>{user?.name}</strong> ({user?.email})
          </span>
          <button
            type="button"
            onClick={() => {
              exitImpersonation();
              window.location.href = '/super-admin';
            }}
            className="rounded-[5px] border border-[#658678] px-3 py-1 text-xs font-semibold transition hover:bg-[#244d40]"
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
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<Loader fill delay={300} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
