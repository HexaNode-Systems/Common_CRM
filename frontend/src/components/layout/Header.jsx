import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, Menu, Search, User as UserIcon, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useThemeMode } from '../../context/ThemeModeContext.jsx';
import { api } from '../../api/client.js';
import Avatar from './Avatar.jsx';
import ProfileModal from './ProfileModal.jsx';

const formatRole = (role) => (role || 'super_admin').replaceAll('_', ' ');
const rupees = (n) => `₹${Number(n || 0).toLocaleString()}`;

// One description per result type, so the dropdown renders every section the same way.
const RESULT_SECTIONS = [
  {
    key: 'leads',
    title: 'Leads',
    href: (l) => `/leads?search=${encodeURIComponent(l.contactName || l.companyName)}`,
    primary: (l) => l.companyName,
    secondary: (l) => (l.contactName ? `${l.contactName} · ${l.phone}` : l.phone),
    chip: (l) => l.status,
  },
  {
    key: 'products',
    title: 'Products & Projects',
    href: (p) => `/catalog?search=${encodeURIComponent(p.title)}`,
    primary: (p) => p.title,
    secondary: (p) => (p.sku ? `SKU ${p.sku}` : p.type ? `Type ${p.type}` : ''),
    meta: (p) => (p.price > 0 ? rupees(p.price) : null),
    chip: (p) => p.projectStatus,
  },
  {
    key: 'orders',
    title: 'Orders',
    href: () => '/orders',
    primary: (o) => `Order: ${o.customerInfo?.name || 'Walk-in Client'}`,
    secondary: (o) => [new Date(o.createdAt).toLocaleDateString(), o.customerInfo?.phone].filter(Boolean).join(' · '),
    meta: (o) => rupees(o.total),
    chip: (o) => o.status,
  },
  {
    key: 'users',
    title: 'Users',
    href: () => '/users',
    avatar: (u) => ({ src: u.profilePhoto, name: u.name }),
    primary: (u) => u.name,
    secondary: (u) => u.email,
    chip: (u) => formatRole(u.role),
  },
];

function SearchResults({ query, results, searching, onPick, onClose }) {
  const sections = RESULT_SECTIONS.filter((s) => results?.[s.key]?.length > 0);

  let body;
  if (searching || !results) {
    body = (
      <div className="ax-muted flex items-center justify-center gap-2 py-6 text-xs">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Searching…
      </div>
    );
  } else if (sections.length === 0) {
    body = <p className="ax-muted py-6 text-center text-xs">No results for “{query}”</p>;
  } else {
    body = (
      <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
        {sections.map((s) => (
          <div key={s.key}>
            <p className="ax-label ax-divider mb-1.5 w-full border-b pb-1.5">{s.title}</p>
            {results[s.key].map((item) => {
              const chip = s.chip(item);
              const meta = s.meta?.(item);
              return (
                <button key={item._id} type="button" className="ax-menu-item" onClick={() => onPick(s.href(item))}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    {s.avatar && <Avatar {...s.avatar(item)} size={24} />}
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium" style={{ color: 'var(--ax-text)' }}>{s.primary(item)}</span>
                      <span className="ax-muted block truncate text-[11px]">{s.secondary(item)}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {meta && <span className="ax-mono text-xs" style={{ color: 'var(--ax-text)' }}>{meta}</span>}
                    {chip && <span className="ax-chip">{chip}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="ax-menu absolute left-0 right-0 top-full z-50 mt-2 min-w-[280px] p-3">{body}</div>
    </>
  );
}

function SearchBox({ className, query, setQuery, open, setOpen, results, searching, onPick }) {
  return (
    <div className={`relative ${className}`}>
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Search size={16} aria-hidden="true" className="ax-muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          className="ax-input ax-input--search"
          placeholder="Search users, orders, products…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </label>
      {open && query && (
        <SearchResults query={query} results={results} searching={searching} onPick={onPick} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setResultsOpen(true);
      } catch (err) {
        console.error('Error performing search', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const search = {
    query,
    setQuery,
    open: resultsOpen,
    setOpen: setResultsOpen,
    results,
    searching,
    onPick: (href) => {
      setResultsOpen(false);
      navigate(href);
    },
  };

  const isDark = mode === 'dark';

  return (
    <header className="ax-chrome sticky top-0 z-20 border-b">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Wrapper carries lg:hidden, because .ax-iconbtn's own display rule would override it */}
        <div className="lg:hidden">
          <button type="button" onClick={onMenuClick} className="ax-iconbtn" aria-label="Open sidebar" title="Open sidebar">
            <Menu size={18} />
          </button>
        </div>

        <h1 className="shrink-0 truncate text-[15px] font-semibold tracking-[-0.015em]">Admin Panel</h1>

        <SearchBox className="mx-auto hidden w-full max-w-xl flex-1 md:block" {...search} />
        <div className="flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleMode}
            className="ax-iconbtn"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button type="button" className="ax-iconbtn" aria-label="Notifications" title="Notifications">
            <Bell size={17} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2.5 rounded-[5px] p-1 pr-2 transition-colors hover:bg-[var(--ax-surface)]"
            >
              <Avatar src={user?.profilePhoto} name={user?.name} size={32} />
              <span className="hidden min-w-0 text-left sm:block">
                <span className="flex items-center gap-1 truncate text-xs font-semibold">
                  {user?.name || 'Super Admin'}
                  <ChevronDown size={12} className="ax-muted" aria-hidden="true" />
                </span>
                <span className="ax-muted block text-[11px] capitalize">{formatRole(user?.role)}</span>
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div role="menu" className="ax-menu absolute right-0 top-full z-30 mt-2 w-48 p-1">
                  <button
                    type="button"
                    role="menuitem"
                    className="ax-menu-item !justify-start"
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileOpen(true);
                    }}
                  >
                    <UserIcon size={15} aria-hidden="true" /> Profile settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="ax-menu-item ax-menu-item--danger !justify-start"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={15} aria-hidden="true" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SearchBox className="px-4 pb-3 md:hidden" {...search} />

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
