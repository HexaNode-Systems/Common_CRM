import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';

// Product column - points to landing page sections (adjust ids if your sections differ)
const productLinks = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Industries', to: '/#industries' },
  { label: 'Security', to: '/#security' },
];

// Resources column
const resourceLinks = [
  { label: 'FAQ', to: '/#faq' },
  { label: 'Sign In', to: '/login' },
  { label: 'Dashboard', to: '/dashboard' },
];

// Legal column - these match the routes registered in App.jsx
const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { label: 'Data Deletion Request', to: '/data-deletion-request' },
  { label: 'Refund Policy', to: '/refund-policy' },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-white">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-sm text-slate-400 transition-colors duration-150 hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Appnix CRM Pro';
  const brandLogo = settings?.brand?.logo || '/logo-favicon.png';

  return (
    <footer className="border-t border-white/10 bg-slate-950 font-theme">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand block */}
          <div className="sm:col-span-2 lg:col-span-1 lg:pr-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/20 p-1.5">
                <img src={brandLogo} alt={brandName} className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold leading-tight text-white">{brandName}</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              One workspace for leads, WhatsApp and delivery — built to run your entire client
              pipeline from a single dashboard.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-200">All Systems Operational</span>
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 lg:mt-16">
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}