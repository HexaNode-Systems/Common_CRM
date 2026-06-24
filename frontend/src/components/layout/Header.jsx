import { Bell, LogOut, Menu, Search } from 'lucide-react';
import Button from '../Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-theme border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <p className="text-sm text-slate-500">{settings?.brand?.name || 'Common CRM'}</p>
          <h1 className="truncate text-base font-semibold">Admin Panel</h1>
        </div>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-10 w-full rounded-theme border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              placeholder="Search users, orders, products..."
              type="search"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent" />
          </button>

          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Super Admin'}</p>
            <p className="text-xs capitalize text-slate-500">{(user?.role || 'super_admin').replaceAll('_', ' ')}</p>
          </div>

          <Button onClick={logout} className="hidden items-center gap-2 px-3 py-2 sm:inline-flex">
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-10 w-full rounded-theme border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            placeholder="Search users, orders, products..."
            type="search"
          />
        </label>
      </div>
    </header>
  );
}
