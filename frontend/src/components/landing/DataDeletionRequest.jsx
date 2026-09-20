import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";
import JsonLd from '../JsonLd.jsx';
import { createBreadcrumbSchema } from '../../utils/seoSchemas.js';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

const METHODS = [
  {
    id: 'method-a',
    label: 'A',
    title: 'Self-service account deletion',
    recommended: true,
    lead: 'Fastest option. Available anytime you can sign in.',
    steps: [
      <>Go to <a href="https://www.appnix.info" target="_blank" rel="noreferrer">www.appnix.info</a> and log into your dashboard.</>,
      <>Open your profile icon in the top-right, then click <strong>Account Settings</strong>.</>,
      <>Scroll to <strong>Privacy &amp; Data Management</strong>.</>,
      <>Select <strong>Permanently Delete Account &amp; Personal Data</strong>.</>,
      <>Enter your password and click <strong>Confirm Deletion</strong>.</>,
      <>Your session ends immediately and the database purge is queued automatically.</>,
    ],
  },
  {
    id: 'method-b',
    label: 'B',
    title: 'Email the privacy desk',
    recommended: false,
    lead: "Use this if you can't sign in, or to request deletion of marketing, newsletter, or form data.",
    steps: [
      <>Email <a href="mailto:support@appnix.info">support@appnix.info</a> from the exact address on your account.</>,
      <>Subject line: <em>"DATA DELETION REQUEST — [your registered email]"</em>.</>,
      <>Include your full legal name, registered email and username, and this statement: <em>"I hereby request the complete, permanent deletion of my account, profile, and all associated personal data from Appnix servers and vendor systems."</em></>,
    ],
  },
  {
    id: 'method-c',
    label: 'C',
    title: 'Disconnect third-party logins',
    recommended: false,
    lead: 'If you signed in via Google or another federated provider, revoke access there too.',
    steps: [
      <>Submit deletion through our portal (Method A or B) first.</>,
      <>In your provider's security settings (e.g. Google Account → Third-party apps with account access), find <strong>Appnix</strong> and select <strong>Remove Access</strong>.</>,
    ],
  },
];

const SECTIONS = [
  {
    id: 'scope',
    number: '1',
    title: 'What gets deleted',
    body: () => (
      <>
        <p>When you request complete data deletion, we run an irrevocable purge across our active database environments:</p>
        <ul>
          <li><strong>Account identifiers.</strong> Full name, profile, phone numbers, avatar, encrypted password hash, and security logs.</li>
          <li><strong>Direct user assets.</strong> Uploaded files, private configurations, workspace settings, saved preferences, and private messages.</li>
          <li><strong>Analytical footprints.</strong> Diagnostic telemetry, historical tracking metadata, and behavioral cookies tied to your user ID are purged or irreversibly anonymized.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'exceptions',
    number: '2',
    title: 'What we have to keep',
    body: (brand) => (
      <>
        <p>We delete everything we can, but some records are held back for statutory reasons:</p>
        <ul>
          <li><strong>Tax &amp; accounting records.</strong> Invoices, purchase history, transaction hashes, and tax data, kept for the standard audit period (typically 5–7 years).</li>
          <li><strong>Disputes &amp; fraud prevention.</strong> Logs tied to an open dispute, chargeback, terms breach, or legal action, kept until the statute of limitations expires.</li>
          <li><strong>Backups.</strong> Live systems are purged instantly; encrypted backups roll off on our normal archival cycle, usually within 30–45 days.</li>
        </ul>
        <p>{brand} does not retain anything beyond what the law requires.</p>
      </>
    ),
  },
  {
    id: 'how-to-request',
    number: '3',
    title: 'How to request deletion',
    isMethods: true,
  },
  {
    id: 'verification',
    number: '4',
    title: 'Identity verification',
    body: () => (
      <p>
        Because deletion is permanent and destructive, we confirm you own the account before acting on
        a manual request. We may send a verification token to your registered email — if it isn't
        confirmed within <strong>7 days</strong>, the request is cancelled and you'll need to resubmit it.
      </p>
    ),
  },
  {
    id: 'timeline',
    number: '5',
    title: 'Timeline',
    body: () => (
      <ul className="dd-timeline">
        <li><strong>Acknowledgment</strong><span>Within 48 hours of your request.</span></li>
        <li><strong>Execution</strong><span>All live records and profile links removed within 30 days of verification.</span></li>
        <li><strong>Final confirmation</strong><span>We email you once purging completes, then remove that address from our records.</span></li>
      </ul>
    ),
  },
  {
    id: 'contact',
    number: '6',
    title: 'Contact',
    body: (brand) => (
      <p>
        Questions about a deletion request? Reach the {brand} data protection desk at{' '}
        <a href="mailto:support@appnix.info">support@appnix.info</a> or through{' '}
        <a href="https://www.appnix.info" target="_blank" rel="noreferrer">www.appnix.info</a>.
      </p>
    ),
  },
];

function MethodCard({ method, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        method.recommended
          ? 'border-primary/40 bg-primary/[0.02] shadow-sm'
          : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
              method.recommended ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {method.label}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                {method.title}
              </span>
              {method.recommended && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{method.lead}</p>
          </div>
        </div>
        <span
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        >
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
            <path
              d="M1 1L7 7L13 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1 sm:px-5 border-t border-slate-100">
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 mt-3">
            {method.steps.map((step, i) => (
              <li key={i} className="leading-relaxed pl-1">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function DataDeletionRequest() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Appnix CRM Pro';

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Data Deletion Request', url: 'https://www.appnix.info/data-deletion-request' },
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-theme flex flex-col">
      <Helmet>
        <title>Data Deletion Request | Appnix CRM Pro</title>
        <meta
          name="description"
          content="Submit a data deletion request for your Appnix CRM Pro account and personal data. Learn what data is erased and how requests are processed."
        />
        <meta
          name="keywords"
          content="Appnix data deletion, Appnix account deletion, data deletion request, account deletion, personal data deletion, GDPR data deletion, CCPA data deletion, DPDP data deletion, Appnix CRM"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.appnix.info/data-deletion-request" />
      </Helmet>
      <JsonLd schema={breadcrumbSchema} />

      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-16 sm:py-20 text-white text-center px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.12),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-red-500/30">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Right to Erasure
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Data Deletion Request
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Request deletion of your account and associated data.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Last updated: September 10, 2026</span>
            <span>·</span>
            <span>Platform Legal Notice</span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Document Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-sm text-slate-800">
            {/* Quick Action Callout Card */}
            <div className="mb-10 rounded-xl border border-red-100 bg-red-50/60 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Ready to delete your data?
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-md">
                  Self-service takes about a minute if you can still sign in to your account.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <a
                  href="#how-to-request"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                >
                  Start deletion request
                </a>
                <a
                  href="mailto:support@appnix.info"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Email privacy desk
                </a>
              </div>
            </div>

            {/* Quick Table of Contents */}
            <div className="mb-10 rounded-xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Table of Contents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors py-1 truncate"
                  >
                    <span className="text-xs font-semibold text-primary">{s.number}.</span>
                    <span className="truncate">{s.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-12">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pb-3 border-b border-slate-200 flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {s.number}
                    </span>
                    <span>{s.title}</span>
                  </h2>
                  <div className="legal-body mt-4 text-sm sm:text-base leading-relaxed text-slate-600 space-y-3">
                    {s.isMethods ? (
                      <div className="space-y-4 pt-1 not-prose">
                        {METHODS.map((m, i) => (
                          <MethodCard key={m.id} method={m} index={i} />
                        ))}
                      </div>
                    ) : (
                      s.body(brandName)
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Important Notice Callout */}
            <div className="mt-12 rounded-xl border border-amber-200/80 bg-amber-50/60 p-5 text-sm text-slate-700">
              <p className="font-semibold text-amber-900">Permanent and Irreversible</p>
              <p className="mt-1 text-slate-600">
                Deletion is permanent and cannot be undone once execution completes. If you're unsure,
                contact{' '}
                <a href="mailto:support@appnix.info" className="text-primary font-medium hover:underline">
                  support@appnix.info
                </a>{' '}
                before confirming.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .legal-body h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .legal-body p {
          margin-bottom: 0.75rem;
          line-height: 1.65;
        }
        .legal-body ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .legal-body li {
          margin-bottom: 0.375rem;
          line-height: 1.6;
        }
        .legal-body strong {
          color: #0f172a;
          font-weight: 600;
        }
        .legal-body a {
          color: #6366f1;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .legal-body a:hover {
          color: #4f46e5;
        }
        .legal-body .dd-timeline {
          list-style: none;
          padding-left: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .legal-body .dd-timeline li {
          border-left: 2px solid #6366f1;
          padding-left: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .legal-body .dd-timeline li strong {
          font-size: 0.95rem;
          color: #0f172a;
        }
        .legal-body .dd-timeline li span {
          font-size: 0.875rem;
          color: #475569;
        }
      `}</style>
    </div>
  );
}