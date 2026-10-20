import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import { Sparkles, Menu, X } from 'lucide-react';
import { ProductNavbar } from './MarketingChrome.jsx';

export default function Navbar({ variant = 'default' }) {
  return variant === 'product' ? <ProductNavbar /> : <LegacyNavbar />;
}

function LegacyNavbar() {
  const { settings } = useSettings();
  const { openInquiryModal } = useInquiry();
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'WhatsApp CRM', href: '/whatsapp-crm' },
    { label: 'Lead Management', href: '/lead-management' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-sm font-theme">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/60 p-1.5">
            <img
              src="/logo-favicon.png"
              alt="Appnix CRM Pro Logo"
              width="40"
              height="40"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              Appnix
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider mt-0.5">
              CRM Pro
            </span>
          </div>
        </Link>


        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="relative text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/login" className="text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900">
            Sign in
          </Link>
          <Button
            onClick={() => openInquiryModal('navbar_get_started')}
            className="text-sm shadow-sm shadow-primary/20"
          >
            Get started
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-in-out lg:hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-4 px-6 py-5">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-4">
            <Link to="/login" className="text-sm font-semibold text-slate-700" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Button
              onClick={() => {
                setOpen(false);
                openInquiryModal('navbar_mobile_get_started');
              }}
              className="w-full justify-center text-sm"
            >
              Get started
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
