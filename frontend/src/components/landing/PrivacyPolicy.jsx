import { useEffect, useRef, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { useSettings } from '../../context/SettingsContext.jsx';


const SECTIONS = [
  {
    id: 'information-we-collect',
    number: '1',
    title: 'Information We Collect',
    body: (brand) => (
      <>
        <p>
          We collect personal information that you voluntarily provide to us, as well as certain
          data automatically collected when you visit, use, or navigate our services.
        </p>
        <h4>A. Information you disclose to us directly</h4>
        <ul>
          <li>
            <strong>Account registration data.</strong> When creating an account, registering
            interest, or signing up for newsletters, we may collect your full name, email
            address, company name, phone number, username, and encrypted password.
          </li>
          <li>
            <strong>Billing and transaction data.</strong> If you make purchases or subscribe to
            paid plans, we collect necessary financial identifiers, billing addresses, invoice
            contacts, and transaction histories. Card and banking transactions are handled by
            PCI-DSS compliant third-party payment gateways — we never store full card numbers on
            our own servers.
          </li>
          <li>
            <strong>Communications and inquiries.</strong> Any feedback, support tickets, survey
            responses, technical queries, or correspondence sent to our support channels.
          </li>
        </ul>
        <h4>B. Information collected automatically</h4>
        <ul>
          <li>
            <strong>Device and browser metadata:</strong> IP address, browser type and version,
            language settings, operating system, device fingerprints, ISP, and system
            configuration.
          </li>
          <li>
            <strong>Usage and telemetry data:</strong> pages visited, referring/exit pages,
            timestamps, clickstream data, scroll depth, time spent per feature, and performance
            logs.
          </li>
          <li>
            <strong>Geolocation data:</strong> general country/city-level location inferred from
            your IP address.
          </li>
        </ul>
        <h4>C. Cookies and web tracking technologies</h4>
        <p>
          {brand} uses cookies, web beacons, pixel tags, and local storage to retain login state,
          monitor service integrity, understand navigation patterns, and improve platform
          functionality. You can manage or disable cookies in your browser preferences, though
          some features may stop working correctly.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-your-data',
    number: '2',
    title: 'How We Use Your Personal Information',
    body: () => (
      <>
        <p>
          We process personal information on a mix of legal grounds — contract performance,
          legitimate business interest, statutory compliance, and your explicit consent:
        </p>
        <ul>
          <li>
            <strong>Account provisioning and authentication</strong> — identity verification,
            profile setup, session management, and access control.
          </li>
          <li>
            <strong>Order execution and service delivery</strong> — running agreements, sending
            invoices, processing recurring billing, and delivering the product you signed up for.
          </li>
          <li>
            <strong>Platform security and fraud prevention</strong> — detecting account takeover,
            malicious traffic, and enforcing our terms.
          </li>
          <li>
            <strong>System maintenance and diagnostics</strong> — evaluating traffic, fixing bugs,
            and running internal quality audits.
          </li>
          <li>
            <strong>Administrative notifications</strong> — critical service, downtime, security,
            and policy-change communications.
          </li>
          <li>
            <strong>Marketing and commercial engagement</strong> — with your consent, newsletters,
            feature releases, and promotions. You can opt out at any time.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-retention',
    number: '3',
    title: 'Data Retention Policy',
    body: () => (
      <p>
        We keep personal data only for as long as it's needed for the purposes described in this
        policy, unless a longer period is required by statutory, fiscal, or audit obligations
        (tax records, fraud mitigation, dispute resolution, and similar). Once our legitimate need
        to process your data ends, we permanently delete, scrub, or securely anonymize it so it
        can no longer be tied back to you.
      </p>
    ),
  },
  {
    id: 'sharing-and-disclosures',
    number: '4',
    title: 'Sharing and Third-Party Disclosures',
    body: (brand) => (
      <>
        <p>
          {brand} does not sell, lease, or monetize your identifiable personal records. We only
          disclose data in a few restricted scenarios:
        </p>
        <ul>
          <li>
            <strong>Qualified service providers</strong> — trusted vendors for cloud hosting,
            database administration, email delivery, support tooling, error monitoring, and
            payments, all bound by strict data processing agreements.
          </li>
          <li>
            <strong>Legal and statutory compulsion</strong> — where required by valid subpoenas,
            court orders, warrants, or regulatory action.
          </li>
          <li>
            <strong>Business restructuring</strong> — in a merger, acquisition, asset sale, or
            insolvency, your records may transfer as part of that transaction, under equivalent
            privacy commitments.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'international-transfers',
    number: '5',
    title: 'International Data Transfers',
    body: () => (
      <p>
        Our infrastructure and cloud vendors may host data across multiple countries. When data
        crosses borders, we put appropriate safeguards in place — such as Standard Contractual
        Clauses approved by international authorities — so your information keeps an equivalent
        level of protection wherever it's processed.
      </p>
    ),
  },
  {
    id: 'your-rights',
    number: '6',
    title: 'Your Data Privacy Rights',
    body: () => (
      <>
        <p>Depending on where you're located, you can exercise some or all of the following:</p>
        <ul>
          <li>
            <strong>Access.</strong> Request the categories and specific pieces of personal
            information we hold about you.
          </li>
          <li>
            <strong>Rectification.</strong> Correct or update inaccurate or incomplete records.
          </li>
          <li>
            <strong>Erasure.</strong> Ask us to delete your profile and data, subject to legal
            retention exceptions.
          </li>
          <li>
            <strong>Restriction.</strong> Request that we limit processing while a dispute is
            resolved.
          </li>
          <li>
            <strong>Portability.</strong> Receive your data in a structured, machine-readable
            format.
          </li>
          <li>
            <strong>Withdraw consent.</strong> Revoke consent-based processing at any time, with
            no retroactive penalty.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact our data protection desk at{' '}
          <a href="mailto:support@appnix.info">support@appnix.info</a>.
        </p>
      </>
    ),
  },
  {
    id: 'protection-of-minors',
    number: '7',
    title: 'Protection of Minors',
    body: (brand) => (
      <p>
        Our services are built for professionals and individuals aged 18 or older. {brand} does
        not knowingly collect personal information from anyone under 18. If we learn that a
        minor's information has reached us, we take swift action to remove it from our systems.
      </p>
    ),
  },
  {
    id: 'amendments',
    number: '8',
    title: 'Amendments to This Policy',
    body: (brand) => (
      <p>
        We may revise this policy periodically to reflect changes in our technical environment,
        service offerings, or applicable regulations. Updates take effect as soon as they're
        posted, so we encourage you to check back here from time to time. {brand}'s current terms
        always live at this page.
      </p>
    ),
  },
  {
    id: 'contact-us',
    number: '9',
    title: 'Contact Us',
    body: (brand) => (
      <p>
        Questions, complaints, or feedback about this policy? Reach {brand} at{' '}
        <a href="mailto:support@appnix.info">support@appnix.info</a> or through{' '}
        <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
          www.appnix.info
        </a>
        .
      </p>
    ),
  },
];

function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/** Fades + rises a section in the first time it scrolls into view. */
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

/** Reading-progress bar tracking scroll position of the whole page. */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      setProgress(height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}

function Section({ section, brand, defaultOpen, index }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef(null);
  const [revealRef, visible] = useRevealOnScroll();

  return (
    <section
      id={section.id}
      ref={revealRef}
      className={`pp-section${visible ? ' is-visible' : ''}`}
      style={{ transitionDelay: visible ? `${Math.min(index, 4) * 60}ms` : '0ms' }}
    >
      <button
        type="button"
        className="pp-section__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="pp-section__number">{section.number.padStart(2, '0')}</span>
        <span className="pp-section__title">{section.title}</span>
        <span className={`pp-section__chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        className="pp-section__panel"
        style={{
          maxHeight: open ? panelRef.current?.scrollHeight ?? 2000 : 0,
        }}
      >
        <div className="pp-section__divider" />
        <div className="pp-section__body">{section.body(brand)}</div>
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Common CRM';
  const ids = SECTIONS.map((s) => s.id);
  const activeId = useScrollSpy(ids);
  const progress = useScrollProgress();
  const [tocOpen, setTocOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const activeIndex = SECTIONS.findIndex((s) => s.id === activeId);
  const [mounted, setMounted] = useState(false);

  // Guard against landing mid-page: the browser natively jumps to whatever
  // element id matches a URL hash (e.g. a stray "#sharing-and-disclosures"
  // left over from a footer link) before React even mounts. Disable scroll
  // restoration, strip the hash, and force an instant scroll to the top so
  // the reader always starts at section 1.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const prevBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = prevBehavior;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <div className={`pp-page${mounted ? ' is-mounted' : ''}`}>

   <Helmet>
  <title>Privacy Policy | Appnix CRM Pro</title>

  <meta
    name="description"
    content="Read the Appnix CRM Pro Privacy Policy to learn how we collect, use, protect, and manage your personal information."
  />

  <meta
    name="keywords"
    content="Appnix CRM privacy policy, CRM privacy, data privacy, personal data protection"
  />

  <link rel="canonical" href="https://appnix.info/privacy-policy" />
</Helmet>


      <div className="pp-progress" style={{ transform: `scaleX(${progress})` }} />
      <style>{`
        .pp-page {
          --ink: #f3f5fb;
          --ink-soft: #9aa3ba;
          --ink-faint: #6b7590;
          --paper: #0a0e1a;
          --panel: #10152650;
          --card: #11162a;
          --line: rgba(255, 255, 255, 0.08);
          --line-strong: rgba(255, 255, 255, 0.14);
          --accent: #5b8bff;
          --accent-2: #38bdf8;
          --accent-soft: rgba(91, 139, 255, 0.14);
          --accent-soft-strong: rgba(91, 139, 255, 0.22);
          background: radial-gradient(circle at 12% -10%, #131a33 0%, var(--paper) 55%);
          color: var(--ink);
          min-height: 100vh;
          font-family: -apple-system, "Inter", "Segoe UI", sans-serif;
        }
        .pp-progress {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          transform-origin: left;
          z-index: 20;
          transition: transform 0.1s linear;
        }
        .pp-hero {
          max-width: 920px;
          margin: 0 auto;
          padding: 64px 24px 32px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .pp-page.is-mounted .pp-hero {
          opacity: 1;
          transform: translateY(0);
        }
        .pp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--ink-faint);
          margin: 0 0 20px;
        }
        .pp-breadcrumb strong { color: var(--ink-soft); font-weight: 500; }
        .pp-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--accent-soft);
          border: 1px solid rgba(91, 139, 255, 0.35);
          color: var(--accent-2);
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 13px;
          border-radius: 999px;
          margin: 0 0 20px;
        }
        .pp-hero__eyebrow svg { flex-shrink: 0; }
        .pp-hero h1 {
          font-family: -apple-system, "Inter", "Segoe UI", sans-serif;
          font-size: clamp(2rem, 4vw, 2.65rem);
          font-weight: 800;
          letter-spacing: -0.015em;
          margin: 0 0 14px;
          color: var(--ink);
        }
        .pp-hero p.pp-hero__lede {
          color: var(--ink-soft);
          font-size: 1.02rem;
          line-height: 1.65;
          max-width: 640px;
          margin: 0 0 22px;
        }
        .pp-hero__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 0.86rem;
          color: var(--ink-faint);
        }
        .pp-hero__meta svg { color: var(--accent-2); flex-shrink: 0; }
        .pp-hero__meta strong { color: var(--ink-soft); font-weight: 600; }
        .pp-hero__dotsep {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: var(--ink-faint);
          flex-shrink: 0;
        }
        .pp-layout {
          max-width: 920px;
          margin: 0 auto;
          padding: 8px 24px 96px;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 760px) {
          .pp-layout { grid-template-columns: 1fr; }
        }

        /* Desktop TOC */
        .pp-toc {
          position: sticky;
          top: 24px;
          display: block;
        }
        .pp-toc__card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px 16px;
        }
        .pp-toc__heading {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin: 0 0 14px;
        }
        .pp-toc__heading svg { color: var(--accent); flex-shrink: 0; }
        .pp-toc__scroll {
          max-height: min(56vh, 480px);
          overflow-y: auto;
          padding-right: 4px;
          margin-right: -4px;
        }
        .pp-toc__scroll::-webkit-scrollbar { width: 4px; }
        .pp-toc__scroll::-webkit-scrollbar-track { background: transparent; }
        .pp-toc__scroll::-webkit-scrollbar-thumb {
          background: var(--line-strong);
          border-radius: 999px;
        }
        .pp-toc__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .pp-toc__item { margin: 0 0 4px; }
        .pp-toc__link {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: transparent;
          border: none;
          padding: 9px 10px;
          border-radius: 10px;
          text-align: left;
          font-size: 0.86rem;
          line-height: 1.35;
          color: var(--ink-faint);
          cursor: pointer;
          transition: background-color 0.25s ease, color 0.2s ease, transform 0.2s ease;
        }
        .pp-toc__link:hover {
          color: var(--ink-soft);
          background: rgba(255, 255, 255, 0.04);
        }
        .pp-toc__link.is-active {
          color: var(--ink);
          font-weight: 600;
          background: var(--accent-soft-strong);
          transform: translateX(2px);
        }
        .pp-toc__num {
          flex-shrink: 0;
          opacity: 0.75;
        }
        .pp-toc__link.is-active .pp-toc__num { color: var(--accent-2); opacity: 1; }

        /* Mobile TOC */
        .pp-toc-mobile { display: none; }
        @media (max-width: 760px) {
          .pp-toc { display: none; }
          .pp-toc-mobile {
            display: block;
            position: sticky;
            top: 0;
            z-index: 5;
            background: rgba(10, 14, 26, 0.92);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid var(--line);
          }
          .pp-toc-mobile__trigger {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: none;
            border: none;
            padding: 14px 24px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--ink);
          }
          .pp-toc-mobile__chevron {
            transition: transform 0.25s ease;
            color: var(--accent-2);
          }
          .pp-toc-mobile__chevron.is-open { transform: rotate(180deg); }
          .pp-toc-mobile__panel {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 24px;
          }
          .pp-toc-mobile__panel.is-open {
            max-height: 420px;
            padding-bottom: 12px;
          }
          .pp-toc-mobile__item {
            display: block;
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            padding: 8px 0;
            font-size: 0.9rem;
            color: var(--ink-faint);
            transition: color 0.2s ease;
          }
          .pp-toc-mobile__item.is-active { color: var(--accent-2); font-weight: 600; }
        }

        .pp-sections { display: flex; flex-direction: column; gap: 4px; }
        .pp-section {
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          padding: 4px 20px;
          margin-bottom: 12px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s ease;
        }
        .pp-section.is-visible { opacity: 1; transform: translateY(0); }
        .pp-section:hover { border-color: var(--line-strong); }
        .pp-section__trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          background: none;
          border: none;
          padding: 20px 0;
          cursor: pointer;
          text-align: left;
        }
        .pp-section__number {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, "Inter", sans-serif;
          background: var(--accent-soft);
          color: var(--accent-2);
          font-size: 0.78rem;
          font-weight: 700;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          flex-shrink: 0;
          transition: background-color 0.25s ease, transform 0.25s ease;
        }
        .pp-section__trigger:hover .pp-section__number {
          background: var(--accent-soft-strong);
          transform: scale(1.05);
        }
        .pp-section__title {
          flex: 1;
          font-size: 1.04rem;
          font-weight: 700;
          color: var(--ink);
          transition: color 0.2s ease;
        }
        .pp-section__trigger:hover .pp-section__title {
          color: var(--accent-2);
        }
        .pp-section__chevron {
          color: var(--ink-faint);
          transition: transform 0.3s ease, color 0.2s ease;
          flex-shrink: 0;
        }
        .pp-section__chevron.is-open { transform: rotate(180deg); color: var(--accent-2); }
        .pp-section__panel {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pp-section__divider {
          height: 1px;
          background: var(--line);
          margin: 0 0 18px 44px;
        }
        .pp-section__body {
          padding: 0 0 24px 44px;
          color: var(--ink-soft);
          font-size: 0.96rem;
          line-height: 1.7;
        }
        .pp-section__body h4 {
          color: var(--ink);
          font-size: 0.92rem;
          font-weight: 700;
          margin: 18px 0 8px;
        }
        .pp-section__body p { margin: 0 0 12px; }
        .pp-section__body ul { margin: 0 0 12px; padding-left: 18px; }
        .pp-section__body li { margin-bottom: 10px; }
        .pp-section__body strong { color: var(--ink); }
        .pp-section__body a {
          color: var(--accent-2);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
        }
        .pp-section__body a:hover { color: var(--accent); }

        .pp-footnote {
          margin-top: 20px;
          padding: 18px 20px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          color: var(--ink-faint);
          font-size: 0.85rem;
        }
        .pp-footnote a { color: var(--accent-2); }

        .pp-top {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--card);
          border: 1px solid var(--line-strong);
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transform: translateY(8px) scale(0.9);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease, background-color 0.2s ease, color 0.2s ease;
          z-index: 15;
        }
        .pp-top.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .pp-top:hover {
          background: var(--accent-soft);
          color: var(--accent-2);
        }

        button:focus-visible,
        a:focus-visible {
          outline: 2px solid var(--accent-2);
          outline-offset: 2px;
          border-radius: 6px;
        }

        @media (prefers-reduced-motion: reduce) {
          .pp-hero, .pp-section, .pp-section__chevron, .pp-section__number,
          .pp-section__panel, .pp-toc__link, .pp-toc-mobile__panel, .pp-top {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="pp-hero">
        <nav className="pp-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Legal</span>
          <span>›</span>
          <strong>Privacy Policy</strong>
        </nav>

        <span className="pp-hero__eyebrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          Data Privacy &amp; Compliance
        </span>

        <h1>{brandName} Privacy Policy</h1>
        <p className="pp-hero__lede">
          This policy explains what personal data {brandName} collects, how we use and share it,
          and the rights you have over your information under GDPR, CCPA/CPRA, DPDPA, and other
          applicable laws.
        </p>

        <div className="pp-hero__meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span><strong>Last updated:</strong> September 10, 2026</span>
          <span className="pp-hero__dotsep" />
          <span>Platform Legal Notice</span>
        </div>
      </div>

      <div className="pp-toc-mobile">
        <button
          type="button"
          className="pp-toc-mobile__trigger"
          aria-expanded={tocOpen}
          onClick={() => setTocOpen((o) => !o)}
        >
          {activeIndex >= 0 ? `${SECTIONS[activeIndex].number}. ${SECTIONS[activeIndex].title}` : 'Contents'}
          <span className={`pp-toc-mobile__chevron${tocOpen ? ' is-open' : ''}`}>
            <svg width="12" height="8" viewBox="0 0 14 9" fill="none">
              <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <div className={`pp-toc-mobile__panel${tocOpen ? ' is-open' : ''}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`pp-toc-mobile__item${activeId === s.id ? ' is-active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.number}. {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="pp-layout">
        <nav className="pp-toc" aria-label="Table of contents">
          <div className="pp-toc__card">
            <div className="pp-toc__heading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Table of contents
            </div>
            <div className="pp-toc__scroll">
              <ul className="pp-toc__list">
                {SECTIONS.map((s) => (
                  <li key={s.id} className="pp-toc__item">
                    <button
                      className={`pp-toc__link${activeId === s.id ? ' is-active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="pp-toc__num">{s.number}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        <div className="pp-sections">
          {SECTIONS.map((s, i) => (
            <Section key={s.id} section={s} brand={brandName} defaultOpen={i === 0} index={i} />
          ))}

          <p className="pp-footnote">
            Questions about this policy? Contact our data protection desk at{' '}
            <a href="mailto:support@appnix.info">support@appnix.info</a>.
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`pp-top${showTop ? ' is-visible' : ''}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}