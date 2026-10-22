import {
  LayoutDashboard, Users, FolderKanban, Target, GitFork, ClipboardList, Lock, FolderOpen,
  BarChart3, Link2, Palette, Headphones, ShieldCheck, PanelLeftOpen, PanelLeftClose, LogOut, X,
  MessageSquare, Send, Laptop, Building2,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { hasPermission } from '../../utils/permissions.js';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { to: '/users', label: 'Users', icon: Users, module: 'users' },
  { to: '/catalog', label: 'Projects Management', icon: FolderKanban, module: 'catalog' },
  { to: '/leads', label: 'Leads Management', icon: Target, end: true, module: 'leads' },
  { to: '/leads/distribution', label: 'Lead Distribution', icon: GitFork, module: 'leads', action: 'delete' },
  { to: '/tasks', label: 'Task Management', icon: ClipboardList, module: 'tasks' },
  { to: '/vault', label: 'Vault / Credentials', icon: Lock, module: 'vault' },
  { to: '/storage', label: 'Storage Management', icon: FolderOpen, module: 'storage' },
  { to: '/whatsapp-inbox', label: 'WhatsApp Inbox', icon: MessageSquare, module: 'whatsapp' },
  { to: '/whatsapp-campaign', label: 'WhatsApp Campaign', icon: Send, module: 'whatsapp' },
  { to: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { to: '/Integrations', label: 'Integrations', icon: Link2, module: 'settings|whatsapp_integration' },
  { to: '/theme', label: 'Theme Settings', icon: Palette, module: 'settings' },
  { to: '/support', label: 'Support Desk', icon: Headphones, module: 'support' },
  { to: '/accessories', label: 'Accessories', icon: Laptop, module: 'accessories' },
  { to: '/super-admin', label: 'SaaS Platform Admin', icon: Building2, globalSuperAdminOnly: true },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, module: 'roles' },
];

function canSee(link, user) {
  if (link.globalSuperAdminOnly) return user?.role === 'super_admin' && !user?.tenantId;
  if (user?.role === 'super_admin') return true;
  if (link.roles && !link.roles.includes(user?.role)) return false;
  if (link.module) return link.module.split('|').some((m) => hasPermission(user, m, link.action || 'read'));
  return true;
}

// Same mark and wordmark as the landing page header, unless the workspace has its own logo or name.
function BrandMark({ logo, name }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2.5">
      {logo ? (
        <img src={logo} alt="" width="30" height="30" className="h-[30px] w-[30px] shrink-0 object-contain" />
      ) : (
        <img
          src="/landing/appnix-mark-34.png"
          srcSet="/landing/appnix-mark-68.png 2x, /landing/appnix-mark-102.png 3x"
          alt=""
          width="30"
          height="30"
          className="shrink-0"
        />
      )}
      {name ? (
        <span className="truncate text-[18px] font-semibold tracking-[-0.04em]" style={{ fontFamily: 'var(--ax-display)' }}>{name}</span>
      ) : (
        <span className="flex items-center whitespace-nowrap" style={{ fontFamily: 'var(--ax-display)' }}>
          <span className="text-[19px] font-semibold tracking-[-0.045em]">Appnix</span>
          <span aria-hidden="true" className="mx-2.5 h-[18px] w-px" style={{ background: 'var(--ax-line-2)' }} />
          <span className="text-[14px] tracking-[-0.03em]">CRM Pro</span>
        </span>
      )}
    </span>
  );
}

function SidebarContent({ iconOnly, isMobile, onToggle, onCloseMobile }) {
  const { settings } = useSettings();
  const { logout, user } = useAuth();
  const customLogo = settings?.brand?.logo;
  const customName = settings?.brand?.name;
  const visibleLinks = links.filter((link) => canSee(link, user));
  const closeIfMobile = isMobile ? onCloseMobile : undefined;
  const itemClass = `ax-nav-link ${iconOnly ? 'ax-nav-link--icon' : ''}`;

  return (
    <div className="flex h-full flex-col">
      {/* Brand + collapse control */}
      <div className={`ax-divider flex h-16 shrink-0 items-center border-b ${iconOnly ? 'justify-center px-3' : 'gap-3 px-4'}`}>
        {!iconOnly && (
          <>
            <BrandMark logo={customLogo} name={customName} />
          </>
        )}
        <button
          type="button"
          onClick={isMobile ? onCloseMobile : onToggle}
          className={`ax-iconbtn ${iconOnly ? '' : 'ax-iconbtn--sm'}`}
          aria-label={isMobile ? 'Close sidebar' : iconOnly ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isMobile ? 'Close sidebar' : iconOnly ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isMobile ? <X size={17} /> : iconOnly ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <nav aria-label="Main" className="ax-nav flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {visibleLinks.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} title={iconOnly ? label : undefined} onClick={closeIfMobile} className={itemClass}>
            <Icon size={17} className="shrink-0" aria-hidden="true" />
            {!iconOnly && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="ax-divider shrink-0 border-t p-3">
        <button
          type="button"
          onClick={() => {
            closeIfMobile?.();
            logout();
          }}
          title={iconOnly ? 'Logout' : undefined}
          className={`${itemClass} ax-nav-link--danger`}
        >
          <LogOut size={17} className="shrink-0" aria-hidden="true" />
          {!iconOnly && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggle }) {
  const shared = { onToggle, onCloseMobile };

  return (
    <>
      {/* Desktop */}
      <aside
        className={`ax-chrome fixed inset-y-0 left-0 z-30 hidden border-r transition-[width] duration-300 ease-in-out lg:block ${collapsed ? 'w-20' : 'w-72'}`}
      >
        <SidebarContent iconOnly={collapsed} isMobile={false} {...shared} />
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className={`ax-overlay absolute inset-0 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`ax-chrome absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <SidebarContent iconOnly={false} isMobile {...shared} />
        </aside>
      </div>
    </>
  );
}
