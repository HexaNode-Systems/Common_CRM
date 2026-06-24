import {
  BadgePercent,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/catalog', label: 'Projects Management', icon: Boxes },
  { to: '/orders', label: 'Leads Management', icon: Receipt },
  { to: '/tasks', label: 'Task Management', icon: WalletCards },
  { to: '/vault', label: 'Vault / Credentials', icon: FileText },
  { to: '/storage', label: 'Storage Management', icon: MessageSquare },
  { to: '/banners', label: 'Banners / Sliders', icon: Image },
  { to: '/coupons', label: 'Coupons / Offers', icon: BadgePercent },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/content', label: 'Website Content', icon: Home },
  { to: '/theme', label: 'Theme Settings', icon: Palette },
  { to: '/settings', label: 'General Settings', icon: Settings },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck }
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggle }) {
  const { settings } = useSettings();
  const { logout } = useAuth();

  const renderSidebar = (isMobile = false) => {
    const iconOnly = collapsed && !isMobile;

    return (
      <>
        <div className={`relative flex h-16 items-center border-b border-slate-200 ${iconOnly ? 'justify-center px-3' : 'gap-3 px-5 pr-14'}`}>
          {iconOnly ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          ) : (
            <>
              {settings?.brand?.logo ? (
                <img src={settings.brand.logo} alt="" className="h-9 w-9 shrink-0 rounded-theme object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-theme bg-primary text-sm font-bold text-white">
                  {(settings?.brand?.name || 'C').slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{settings?.brand?.name || 'Common CRM'}</p>
                <p className="text-xs text-slate-500">Reusable Admin</p>
              </div>
              <button
                type="button"
                onClick={isMobile ? onCloseMobile : onToggle}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label={isMobile ? 'Close sidebar' : 'Collapse sidebar'}
                title={isMobile ? 'Close sidebar' : 'Collapse sidebar'}
              >
                {isMobile ? <X size={18} /> : <ChevronLeft size={18} />}
              </button>
            </>
          )}
        </div>

        <nav className="h-[calc(100vh-8rem)] space-y-1 overflow-y-auto px-3 py-4 pb-24">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                title={iconOnly ? link.label : undefined}
                onClick={isMobile ? onCloseMobile : undefined}
                className={({ isActive }) =>
                  `flex h-10 items-center rounded-theme text-sm font-medium transition ${
                    iconOnly ? 'justify-center px-0' : 'gap-3 px-3'
                  } ${
                    isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className={`truncate transition-opacity duration-200 ${iconOnly ? 'hidden opacity-0' : 'block opacity-100'}`}>
                  {link.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={() => {
              if (isMobile) onCloseMobile();
              logout();
            }}
            title={iconOnly ? 'Logout' : undefined}
            className={`flex h-11 w-full items-center rounded-theme text-sm font-semibold text-red-600 transition hover:bg-red-50 ${
              iconOnly ? 'justify-center px-0' : 'gap-3 px-3'
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`truncate transition-opacity duration-200 ${iconOnly ? 'hidden opacity-0' : 'block opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out lg:block ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {renderSidebar(false)}
      </aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-slate-900/45 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebar(true)}
        </aside>
      </div>
    </>
  );
}
