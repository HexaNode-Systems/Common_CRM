import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";

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

function useRevealOnScroll() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

function MethodCard({ method, index }) {
  const [open, setOpen] = useState(index === 0);
  const panelRef = useRef(null);

  return (
  
    <div className={`dd-method${method.recommended ? ' is-recommended' : ''}`}>
      <button
        type="button"
        className="dd-method__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dd-method__label">{method.label}</span>
        <span className="dd-method__heading">
          <span className="dd-method__title">
            {method.title}
            {method.recommended && <span className="dd-method__badge">Recommended</span>}
          </span>
          <span className="dd-method__lead">{method.lead}</span>
        </span>
        <span className={`dd-method__chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        className="dd-method__panel"
        style={{ maxHeight: open ? panelRef.current?.scrollHeight ?? 1000 : 0 }}
      >
        <ol className="dd-method__steps">
          {method.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Section({ section, brand, defaultOpen, index }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef(null);
  const [revealRef, visible] = useRevealOnScroll();

  return (
    <section
      id={section.id}
      ref={revealRef}
      className={`dd-section${visible ? ' is-visible' : ''}`}
      style={{ transitionDelay: visible ? `${Math.min(index, 4) * 60}ms` : '0ms' }}
    >
      <button
        type="button"
        className="dd-section__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dd-section__number">{section.number.padStart(2, '0')}</span>
        <span className="dd-section__title">{section.title}</span>
        <span className={`dd-section__chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        className="dd-section__panel"
        style={{ maxHeight: open ? panelRef.current?.scrollHeight ?? 3000 : 0 }}
      >
        <div className="dd-section__divider" />
        <div className="dd-section__body">
          {section.isMethods ? (
            <div className="dd-methods">
              {METHODS.map((m, i) => (
                <MethodCard key={m.id} method={m} index={i} />
              ))}
            </div>
          ) : (
            section.body(brand)
          )}
        </div>
      </div>
    </section>
  );
}

export default function DataDeletionRequest() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Common CRM';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
      <>
       <Helmet>
      <title>Data Deletion Request | Appnix CRM Pro</title>

      <meta
        name="description"
        content="Request permanent deletion of your Appnix CRM Pro account and personal data. Learn what data is deleted, what may be retained, and how to submit a deletion request."
      />

      <meta
        name="keywords"
        content="Appnix data deletion, Appnix account deletion, data deletion request, account deletion, personal data deletion, GDPR data deletion, CCPA data deletion, DPDP data deletion, Appnix CRM"
      />

      <link
        rel="canonical"
        href="https://appnix.info/data-deletion-request"
      />
      </Helmet>

      
    <div className={`dd-page${mounted ? ' is-mounted' : ''}`}>
      <style>{`
        .dd-page {
          --ink: #f3f5fb;
          --ink-soft: #9aa3ba;
          --ink-faint: #6b7590;
          --paper: #0a0e1a;
          --card: #11162a;
          --line: rgba(255, 255, 255, 0.08);
          --line-strong: rgba(255, 255, 255, 0.14);
          --accent: #5b8bff;
          --accent-2: #38bdf8;
          --accent-soft: rgba(91, 139, 255, 0.14);
          --accent-soft-strong: rgba(91, 139, 255, 0.22);
          --danger: #f97066;
          --danger-soft: rgba(249, 112, 102, 0.14);
          background: radial-gradient(circle at 12% -10%, #131a33 0%, var(--paper) 55%);
          color: var(--ink);
          min-height: 100vh;
          font-family: -apple-system, "Inter", "Segoe UI", sans-serif;
        }
        .dd-hero {
          max-width: 820px;
          margin: 0 auto;
          padding: 64px 24px 8px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .dd-page.is-mounted .dd-hero { opacity: 1; transform: translateY(0); }
        .dd-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.82rem; color: var(--ink-faint); margin: 0 0 20px;
        }
        .dd-breadcrumb strong { color: var(--ink-soft); font-weight: 500; }
        .dd-hero__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: var(--danger-soft);
          border: 1px solid rgba(249, 112, 102, 0.35);
          color: var(--danger);
          font-size: 0.78rem; font-weight: 600;
          padding: 6px 13px; border-radius: 999px; margin: 0 0 20px;
        }
        .dd-hero__eyebrow svg { flex-shrink: 0; }
        .dd-hero h1 {
          font-size: clamp(2rem, 4vw, 2.65rem);
          font-weight: 800; letter-spacing: -0.015em;
          margin: 0 0 14px; color: var(--ink);
        }
        .dd-hero p.dd-hero__lede {
          color: var(--ink-soft); font-size: 1.02rem; line-height: 1.65;
          max-width: 620px; margin: 0 0 22px;
        }
        .dd-hero__meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
          font-size: 0.86rem; color: var(--ink-faint); margin-bottom: 8px;
        }
        .dd-hero__meta svg { color: var(--accent-2); flex-shrink: 0; }
        .dd-hero__meta strong { color: var(--ink-soft); font-weight: 600; }
        .dd-hero__dotsep { width: 3px; height: 3px; border-radius: 999px; background: var(--ink-faint); flex-shrink: 0; }

        .dd-cta {
          max-width: 820px; margin: 24px auto 0; padding: 0 24px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s;
        }
        .dd-page.is-mounted .dd-cta { opacity: 1; transform: translateY(0); }
        .dd-cta__card {
          display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between;
          background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px 24px;
        }
        .dd-cta__text { color: var(--ink-soft); font-size: 0.92rem; max-width: 420px; }
        .dd-cta__text strong { display: block; color: var(--ink); font-size: 1rem; margin-bottom: 3px; }
        .dd-cta__actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .dd-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.88rem; font-weight: 600; padding: 10px 16px;
          border-radius: 10px; text-decoration: none; cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .dd-btn--primary { background: var(--danger); color: #1a0806; border: 1px solid var(--danger); }
        .dd-btn--primary:hover { background: #ff8378; }
        .dd-btn--ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--line-strong); }
        .dd-btn--ghost:hover { color: var(--ink); border-color: var(--ink-faint); }

        .dd-layout { max-width: 820px; margin: 0 auto; padding: 32px 24px 96px; }

        .dd-sections { display: flex; flex-direction: column; }
        .dd-section {
          border: 1px solid var(--line); border-radius: 14px; background: var(--card);
          padding: 4px 20px; margin-bottom: 12px;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s ease;
        }
        .dd-section.is-visible { opacity: 1; transform: translateY(0); }
        .dd-section:hover { border-color: var(--line-strong); }
        .dd-section__trigger {
          width: 100%; display: flex; align-items: center; gap: 14px;
          background: none; border: none; padding: 20px 0; cursor: pointer; text-align: left;
        }
        .dd-section__number {
          display: flex; align-items: center; justify-content: center;
          background: var(--accent-soft); color: var(--accent-2);
          font-size: 0.78rem; font-weight: 700; width: 30px; height: 30px;
          border-radius: 9px; flex-shrink: 0;
          transition: background-color 0.25s ease, transform 0.25s ease;
        }
        .dd-section__trigger:hover .dd-section__number { background: var(--accent-soft-strong); transform: scale(1.05); }
        .dd-section__title { flex: 1; font-size: 1.04rem; font-weight: 700; color: var(--ink); transition: color 0.2s ease; }
        .dd-section__trigger:hover .dd-section__title { color: var(--accent-2); }
        .dd-section__chevron { color: var(--ink-faint); transition: transform 0.3s ease, color 0.2s ease; flex-shrink: 0; }
        .dd-section__chevron.is-open { transform: rotate(180deg); color: var(--accent-2); }
        .dd-section__panel { overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        .dd-section__divider { height: 1px; background: var(--line); margin: 0 0 18px 44px; }
        .dd-section__body { padding: 0 0 24px 44px; color: var(--ink-soft); font-size: 0.96rem; line-height: 1.7; }
        .dd-section__body p { margin: 0 0 12px; }
        .dd-section__body ul { margin: 0 0 4px; padding-left: 18px; }
        .dd-section__body li { margin-bottom: 10px; }
        .dd-section__body strong { color: var(--ink); }
        .dd-section__body em { color: var(--ink); font-style: normal; background: rgba(255,255,255,0.04); padding: 1px 5px; border-radius: 4px; }
        .dd-section__body a { color: var(--accent-2); text-decoration: underline; text-underline-offset: 2px; transition: color 0.2s ease; }
        .dd-section__body a:hover { color: var(--accent); }

        .dd-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .dd-timeline li {
          display: flex; flex-direction: column; gap: 2px;
          border-left: 2px solid var(--accent-soft-strong); padding-left: 14px;
        }
        .dd-timeline li strong { color: var(--ink); font-size: 0.92rem; }
        .dd-timeline li span { color: var(--ink-soft); font-size: 0.9rem; }

        .dd-methods { display: flex; flex-direction: column; gap: 10px; }
        .dd-method {
          border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,0.015);
          padding: 2px 16px; transition: border-color 0.2s ease;
        }
        .dd-method.is-recommended { border-color: rgba(91, 139, 255, 0.3); }
        .dd-method:hover { border-color: var(--line-strong); }
        .dd-method__trigger {
          width: 100%; display: flex; align-items: flex-start; gap: 14px;
          background: none; border: none; padding: 16px 0; cursor: pointer; text-align: left;
        }
        .dd-method__label {
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 26px; height: 26px; border-radius: 8px; margin-top: 2px;
          background: var(--accent-soft); color: var(--accent-2); font-size: 0.76rem; font-weight: 700;
        }
        .dd-method__heading { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .dd-method__title { color: var(--ink); font-size: 0.96rem; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .dd-method__badge {
          font-size: 0.68rem; font-weight: 700; color: var(--accent-2);
          background: var(--accent-soft); border-radius: 999px; padding: 2px 9px;
        }
        .dd-method__lead { color: var(--ink-faint); font-size: 0.85rem; line-height: 1.5; }
        .dd-method__chevron { color: var(--ink-faint); flex-shrink: 0; margin-top: 6px; transition: transform 0.3s ease, color 0.2s ease; }
        .dd-method__chevron.is-open { transform: rotate(180deg); color: var(--accent-2); }
        .dd-method__panel { overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        .dd-method__steps {
          margin: 0 0 18px 40px; padding-left: 18px; color: var(--ink-soft);
          font-size: 0.9rem; line-height: 1.6; display: flex; flex-direction: column; gap: 8px;
        }
        .dd-method__steps a { color: var(--accent-2); }
        .dd-method__steps strong { color: var(--ink); }
        .dd-method__steps em { color: var(--ink); font-style: normal; background: rgba(255,255,255,0.04); padding: 1px 5px; border-radius: 4px; }

        .dd-footnote {
          margin-top: 8px; padding: 18px 20px; border: 1px solid var(--line);
          border-radius: 14px; background: var(--card); color: var(--ink-faint); font-size: 0.85rem;
        }
        .dd-footnote a { color: var(--accent-2); }

        button:focus-visible, a:focus-visible { outline: 2px solid var(--accent-2); outline-offset: 2px; border-radius: 6px; }

        @media (prefers-reduced-motion: reduce) {
          .dd-hero, .dd-cta, .dd-section, .dd-section__chevron, .dd-section__number,
          .dd-section__panel, .dd-method__chevron, .dd-method__panel {
            transition: none !important; transform: none !important; opacity: 1 !important;
          }
        }
      `}</style>

      <div className="dd-hero">
        <nav className="dd-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span><span>›</span><span>Legal</span><span>›</span>
          <strong>Data Deletion Request</strong>
        </nav>

        <span className="dd-hero__eyebrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Right to Erasure
        </span>

        <h1>{brandName} Data Deletion Request</h1>
        <p className="dd-hero__lede">
          You can request permanent deletion of your account and personal data at any time. This
          page explains what gets deleted, what we're required to keep, and how to submit a
          request under GDPR Art. 17, CCPA/CPRA, and the DPDP framework.
        </p>

        <div className="dd-hero__meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span><strong>Last updated:</strong> September 10, 2026</span>
          <span className="dd-hero__dotsep" />
          <span>Platform Legal Notice</span>
        </div>
      </div>

      <div className="dd-cta">
        <div className="dd-cta__card">
          <div className="dd-cta__text">
            <strong>Ready to delete your data?</strong>
            Self-service takes about a minute if you can still sign in.
          </div>
          <div className="dd-cta__actions">
            <a className="dd-btn dd-btn--primary" href="#how-to-request">
              Start deletion request
            </a>
            <a className="dd-btn dd-btn--ghost" href="mailto:support@appnix.info">
              Email privacy desk
            </a>
          </div>
        </div>
      </div>

      <div className="dd-layout">
        <div className="dd-sections">
          {SECTIONS.map((s, i) => (
            <Section key={s.id} section={s} brand={brandName} defaultOpen={i === 0} index={i} />
          ))}

          <p className="dd-footnote">
            Deletion is permanent and can't be undone once execution completes. If you're unsure,
            contact <a href="mailto:support@appnix.info">support@appnix.info</a> before confirming.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}