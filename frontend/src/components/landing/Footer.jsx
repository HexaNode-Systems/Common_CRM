import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';

// Product column
const productLinks = [
  { label: 'WhatsApp CRM', to: '/whatsapp-crm' },
  { label: 'Lead Management', to: '/lead-management' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Features', to: '/#features' },
];

// Resources column
const resourceLinks = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/#faq' },
  { label: 'Sign In', to: '/login' },
  { label: 'Start Free Trial', action: 'inquiry', source: 'footer_start_trial' },
];

// Legal links - these match the routes registered in App.jsx. Orchid keeps these
// in the bottom bar next to the copyright line rather than as their own column.
const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { label: 'Data Deletion Request', to: '/data-deletion-request' },
  { label: 'Refund Policy', to: '/refund-policy' },
];

// Inline icons so we don't pull in an icon package just for four marks.
// Each is a single filled path on a 24x24 grid and inherits currentColor.
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
  </svg>
);

const LinkedInIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.584-6.64 7.584H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65Z" />
  </svg>
);

const YouTubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
  </svg>
);

// Reads from settings when available so the links can be managed from the admin
// side, with sensible fallbacks for local dev.
function buildSocialLinks(settings) {
  const s = settings?.social || {};
  return [
    { label: 'Instagram', href: s.instagram || 'https://instagram.com', Icon: InstagramIcon },
    { label: 'LinkedIn', href: s.linkedin || 'https://linkedin.com', Icon: LinkedInIcon },
    { label: 'X', href: s.x || s.twitter || 'https://x.com', Icon: XIcon },
    { label: 'YouTube', href: s.youtube || 'https://youtube.com', Icon: YouTubeIcon },
  ];
}

function FooterColumn({ title, links, onOpenInquiry }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            {l.action === 'inquiry' ? (
              <button
                type="button"
                onClick={() => onOpenInquiry?.(l.source || 'footer_start_trial')}
                className="text-left text-sm text-slate-400 transition-colors duration-150 hover:text-white"
              >
                {l.label}
              </button>
            ) : (
              <Link
                to={l.to}
                className="text-sm text-slate-400 transition-colors duration-150 hover:text-white"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { settings } = useSettings();
  const { openInquiryModal } = useInquiry();
  const brandName = settings?.brand?.name || 'Appnix CRM Pro';
  const brandLogo = settings?.brand?.logo || '/logo-favicon.png';
  const socialLinks = buildSocialLinks(settings);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950 font-theme">
      {/* Faint glow echoing the hero, kept low so it reads as texture, not a repeat of the hero moment */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-8">
          {/* Brand block */}
          <div className="sm:col-span-2 lg:col-span-1 lg:pr-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
                <img
                  src={brandLogo}
                  alt={`${brandName} Logo`}
                  width="44"
                  height="44"
                  className="h-full w-full object-contain"
                />
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

            {/* Social links */}
            <ul className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors duration-150 hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Resources" links={resourceLinks} onOpenInquiry={openInquiryModal} />
        </div>

        {/* Bottom bar — copyright left, legal links right, matching Orchid's footer row */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between lg:mt-16">
          <p className="order-2 text-xs text-slate-500 sm:order-1">
            &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>

          <ul className="order-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:order-2">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-xs text-slate-500 transition-colors duration-150 hover:text-slate-300"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}