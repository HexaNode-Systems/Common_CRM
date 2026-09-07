import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Sparkles, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'Industries', href: '#industries' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md font-theme">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          {settings?.brand?.logo ? (
            <img src={settings.brand.logo} alt={settings?.brand?.name || 'CRM'} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </span>
          )}
          <span className="text-lg font-bold tracking-tight text-slate-900">
            {settings?.brand?.name || 'Common CRM'}
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Sign in
          </Link>
          <Link to="/login">
            <Button className="text-sm">Get started</Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link to="/login" className="text-sm font-semibold text-slate-700">Sign in</Link>
              <Link to="/login"><Button className="w-full justify-center text-sm">Get started</Button></Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}