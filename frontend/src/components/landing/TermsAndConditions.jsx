import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";

const SECTIONS = [
  {
    id: 'acceptance-of-terms',
    number: '1',
    title: 'Acceptance of Terms',
    body: (brand) => (
      <>
        <p>
          These Terms and Conditions constitute a legally binding agreement entered into between
          you (either as an individual or on behalf of an entity, "User", "you", or "your") and{' '}
          {brand} ("Company", "we", "us", or "our"), governing your access to and utilization of
          the website{' '}
          <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
            https://www.appnix.info
          </a>{' '}
          along with any connected applications, software products, and consulting services
          (collectively, the "Platform").
        </p>
        <p>
          By visiting, browsing, registering for, or transacting on the Platform, you acknowledge
          that you have read, comprehended, and agreed to adhere strictly to these Terms. If you
          do not consent to these Terms in their entirety, you must refrain from accessing or
          using the Platform immediately.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility-and-account-responsibility',
    number: '2',
    title: 'Eligibility and Account Responsibility',
    body: () => (
      <ul>
        <li>
          <strong>Age threshold.</strong> You must be at least 18 years of age or hold the legal
          age of majority in your jurisdiction to utilize our Services.
        </li>
        <li>
          <strong>Accurate credentials.</strong> You agree to provide true, current, complete, and
          accurate information during account registration and maintain the validity of your
          profile details.
        </li>
        <li>
          <strong>Credential security.</strong> You are solely responsible for maintaining the
          confidentiality of your credentials, usernames, and passwords. You accept responsibility
          for all activity occurring under your account. You must notify us immediately at{' '}
          <a href="mailto:support@appnix.info">support@appnix.info</a> if you suspect unauthorized
          account access.
        </li>
      </ul>
    ),
  },
  {
    id: 'intellectual-property-rights',
    number: '3',
    title: 'Intellectual Property Rights',
    body: (brand) => (
      <ul>
        <li>
          <strong>Platform ownership.</strong> All software code, graphical user interfaces,
          database structures, designs, text, videos, audio, trademarks, brand assets, and
          proprietary algorithms hosted on{' '}
          <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
            https://www.appnix.info
          </a>{' '}
          are the exclusive intellectual property of {brand} or its authorized licensors.
        </li>
        <li>
          <strong>Limited license grant.</strong> We grant you a revocable, non-exclusive,
          non-transferable, limited license to access and view Platform materials strictly in
          accordance with these Terms.
        </li>
        <li>
          <strong>Reservation of rights.</strong> You may not copy, reproduce, scrape, reverse
          engineer, decompile, mirror, distribute, monetize, or sublicense any part of the
          Platform without our prior written authorization.
        </li>
      </ul>
    ),
  },
  {
    id: 'acceptable-use-and-prohibited-activities',
    number: '4',
    title: 'Acceptable Use and Prohibited Activities',
    body: () => (
      <>
        <p>
          You agree not to engage in any activity that harms, disables, or disrupts our
          infrastructure, users, or third-party relations. Prohibited actions include:
        </p>
        <ul>
          <li>
            <strong>Security violations.</strong> Attempting to bypass security safeguards,
            perform vulnerability scans, execute unauthorized penetration testing, or breach
            authentication barriers.
          </li>
          <li>
            <strong>Scraping and automation.</strong> Deploying crawlers, spiders, scraping
            engines, or automation bots to extract mass data, user directories, or internal
            content.
          </li>
          <li>
            <strong>Malware distribution.</strong> Injecting viruses, worms, Trojan horses,
            spyware, ransomware, or any code intended to impair computational infrastructure.
          </li>
          <li>
            <strong>Harassment and impersonation.</strong> Masquerading as an authorized employee
            of ours, falsely claiming partnership, or deploying communications designed to deceive
            or harass others.
          </li>
          <li>
            <strong>Unlawful exploitation.</strong> Using the platform to breach state, national,
            or international statutes, intellectual property laws, export controls, or data
            privacy rules.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'billing-pricing-and-payments',
    number: '5',
    title: 'Billing, Pricing, and Payments',
    body: (brand) => (
      <ul>
        <li>
          <strong>Payment obligations.</strong> By purchasing any service or software subscription
          on{' '}
          <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
            https://www.appnix.info
          </a>
          , you authorize us and our third-party billing processors to bill the chosen payment
          instrument for all associated fees, taxes, and recurring rates.
        </li>
        <li>
          <strong>Price revisions.</strong> We reserve the right to revise our rates and
          subscription tiers at our discretion. Notice of price revisions will be issued via email
          or Platform updates prior to taking effect. Continued usage following pricing changes
          denotes approval.
        </li>
        <li>
          <strong>Default &amp; delinquency.</strong> Failure to settle invoices on time may
          result in immediate suspension, restriction, or termination of your account access and
          associated data assets.
        </li>
      </ul>
    ),
  },
  {
    id: 'third-party-links-and-integrations',
    number: '6',
    title: 'Third-Party Links and Integrations',
    body: (brand) => (
      <p>
        Our Platform may embed links or facilitate integrations with external, third-party
        software, payment gateways, or documentation sites. {brand} neither endorses nor assumes
        legal liability for the content, privacy practices, terms, or stability of external
        platforms. You navigate third-party services entirely at your own discretion and risk.
      </p>
    ),
  },
  {
    id: 'termination-and-suspension',
    number: '7',
    title: 'Termination and Suspension',
    body: (brand) => (
      <>
        <p>
          We retain the absolute authority to suspend, deactivate, or terminate your account and
          revoke your platform permissions at our sole discretion, without prior notice or
          liability, for reasons including:
        </p>
        <ul>
          <li>Violation of any clause within these Terms.</li>
          <li>Suspected fraudulent, deceptive, or abusive behavior.</li>
          <li>Inactivity, legal demands, or non-payment of required fees.</li>
        </ul>
        <p>
          Upon termination, all licenses granted to you terminate automatically, and {brand}{' '}
          reserves the right to scrub associated stored profile data in accordance with our
          deletion policies.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimer-of-warranties',
    number: '8',
    title: 'Disclaimer of Warranties ("As-Is")',
    body: (brand) => (
      <>
        <p>
          The Platform, its content, software, and all ancillary services are provided strictly on
          an "as is" and "as available" basis, without warranties of any kind, either express or
          implied.
        </p>
        <p>
          {brand} expressly disclaims all warranties, including merchantability, fitness for a
          particular purpose, title, non-infringement, accuracy, and uninterrupted or bug-free
          availability. We do not warrant that defects will be rectified or that our servers are
          free of viruses or malicious components.
        </p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    number: '9',
    title: 'Limitation of Liability',
    body: (brand) => (
      <>
        <p>
          To the maximum extent permissible under applicable law, in no event shall {brand}, its
          founders, directors, affiliates, agents, or licensors be held liable for any indirect,
          consequential, punitive, special, incidental, or exemplary damages (including loss of
          profits, loss of revenue, loss of business opportunity, corruption of data, system
          outages, or replacement expenses), regardless of the legal theory asserted.
        </p>
        <p>
          Our total cumulative liability arising out of or in connection with your use of the
          Platform shall not exceed the total sum actually paid by you to {brand} over the
          preceding three (3) month period for the specific service giving rise to the claim.
        </p>
      </>
    ),
  },
  {
    id: 'indemnification',
    number: '10',
    title: 'Indemnification',
    body: (brand) => (
      <>
        <p>
          You agree to defend, indemnify, and hold harmless {brand}, its corporate affiliates,
          officers, employees, contractors, and agents against all liabilities, claims, losses,
          damages, settlements, expenses, and legal fees resulting from:
        </p>
        <ul>
          <li>Your violation of these Terms.</li>
          <li>Your misuse of the Platform or services.</li>
          <li>Your infringement of third-party intellectual property or privacy rights.</li>
          <li>Any content or material you upload, transmit, or process via our systems.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'governing-law-and-jurisdiction',
    number: '11',
    title: 'Governing Law and Jurisdiction',
    body: () => (
      <p>
        These Terms shall be interpreted and governed in accordance with the substantive laws of{' '}
        [Your State / Country], without giving effect to conflicts-of-law principles. Any legal
        suit, arbitration, or judicial proceeding arising from these Terms shall be instituted
        exclusively in the competent courts located within [Your City/Jurisdiction].
      </p>
    ),
  },
  {
    id: 'miscellaneous',
    number: '12',
    title: 'Miscellaneous',
    body: (brand) => (
      <ul>
        <li>
          <strong>Entire agreement.</strong> These Terms, together with our Privacy Policy and
          Refund Policy, embody the entire understanding between you and {brand}.
        </li>
        <li>
          <strong>Severability.</strong> If any provision of these Terms is deemed unlawful or
          unenforceable by a court of competent jurisdiction, the remaining terms shall continue
          in full force and effect.
        </li>
        <li>
          <strong>No waiver.</strong> Our failure to enforce any right or covenant of these Terms
          does not constitute a waiver of future enforcement of that provision.
        </li>
      </ul>
    ),
  },
  {
    id: 'contact-information',
    number: '13',
    title: 'Contact Information',
    body: (brand) => (
      <p>
        For questions, notices, or support concerning these Terms, contact {brand} at{' '}
        <a href="mailto:support@appnix.info">support@appnix.info</a> or through{' '}
        <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
          https://www.appnix.info
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
      className={`tc-section${visible ? ' is-visible' : ''}`}
      style={{ transitionDelay: visible ? `${Math.min(index, 4) * 60}ms` : '0ms' }}
    >
      <button
        type="button"
        className="tc-section__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tc-section__number">{section.number.padStart(2, '0')}</span>
        <span className="tc-section__title">{section.title}</span>
        <span className={`tc-section__chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        className="tc-section__panel"
        style={{
          maxHeight: open ? panelRef.current?.scrollHeight ?? 4000 : 0,
        }}
      >
        <div className="tc-section__divider" />
        <div className="tc-section__body">{section.body(brand)}</div>
      </div>
    </section>
  );
}

export default function TermsAndConditions() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Appnix';
  const ids = SECTIONS.map((s) => s.id);
  const activeId = useScrollSpy(ids);
  const progress = useScrollProgress();
  const [tocOpen, setTocOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const activeIndex = SECTIONS.findIndex((s) => s.id === activeId);
  const [mounted, setMounted] = useState(false);

  // Guard against landing mid-page: force an instant scroll to the top and
  // strip any leftover URL hash so a stray anchor link elsewhere in the app
  // can't cause the browser to natively jump into the middle of the page.
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
    <div className={`tc-page${mounted ? ' is-mounted' : ''}`}>
      <Helmet>
        <title>Terms and Conditions | Appnix CRM Pro</title>

        <meta
          name="description"
          content="Read the Terms and Conditions governing your use of Appnix CRM Pro, covering account eligibility, billing, intellectual property, liability and more."
        />

        <meta
          name="keywords"
          content="Appnix terms and conditions, Appnix CRM terms of use, CRM software agreement, Appnix legal terms"
        />

        <link rel="canonical" href="https://appnix.info/terms-and-conditions" />
      </Helmet>

      <div className="tc-progress" style={{ transform: `scaleX(${progress})` }} />
      <style>{`
        .tc-page {
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
          background: radial-gradient(circle at 12% -10%, #131a33 0%, var(--paper) 55%);
          color: var(--ink);
          min-height: 100vh;
          font-family: -apple-system, "Inter", "Segoe UI", sans-serif;
        }
        .tc-progress {
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
        .tc-hero {
          max-width: 920px;
          margin: 0 auto;
          padding: 64px 24px 32px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .tc-page.is-mounted .tc-hero {
          opacity: 1;
          transform: translateY(0);
        }
        .tc-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--ink-faint);
          margin: 0 0 20px;
        }
        .tc-breadcrumb strong { color: var(--ink-soft); font-weight: 500; }
        .tc-hero__eyebrow {
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
        .tc-hero__eyebrow svg { flex-shrink: 0; }
        .tc-hero h1 {
          font-family: -apple-system, "Inter", "Segoe UI", sans-serif;
          font-size: clamp(2rem, 4vw, 2.65rem);
          font-weight: 800;
          letter-spacing: -0.015em;
          margin: 0 0 14px;
          color: var(--ink);
        }
        .tc-hero p.tc-hero__lede {
          color: var(--ink-soft);
          font-size: 1.02rem;
          line-height: 1.65;
          max-width: 640px;
          margin: 0 0 22px;
        }
        .tc-hero__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 0.86rem;
          color: var(--ink-faint);
        }
        .tc-hero__meta svg { color: var(--accent-2); flex-shrink: 0; }
        .tc-hero__meta strong { color: var(--ink-soft); font-weight: 600; }
        .tc-hero__dotsep {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: var(--ink-faint);
          flex-shrink: 0;
        }
        .tc-hero__warning {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px solid rgba(91, 139, 255, 0.25);
          background: var(--accent-soft);
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.6;
          color: var(--ink-soft);
          max-width: 640px;
        }
        .tc-layout {
          max-width: 920px;
          margin: 0 auto;
          padding: 8px 24px 96px;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 760px) {
          .tc-layout { grid-template-columns: 1fr; }
        }

        /* Desktop TOC */
        .tc-toc {
          position: sticky;
          top: 24px;
          display: block;
        }
        .tc-toc__card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px 16px;
        }
        .tc-toc__heading {
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
        .tc-toc__heading svg { color: var(--accent); flex-shrink: 0; }
        .tc-toc__scroll {
          max-height: min(56vh, 480px);
          overflow-y: auto;
          padding-right: 4px;
          margin-right: -4px;
        }
        .tc-toc__scroll::-webkit-scrollbar { width: 4px; }
        .tc-toc__scroll::-webkit-scrollbar-track { background: transparent; }
        .tc-toc__scroll::-webkit-scrollbar-thumb {
          background: var(--line-strong);
          border-radius: 999px;
        }
        .tc-toc__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .tc-toc__item { margin: 0 0 4px; }
        .tc-toc__link {
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
        .tc-toc__link:hover {
          color: var(--ink-soft);
          background: rgba(255, 255, 255, 0.04);
        }
        .tc-toc__link.is-active {
          color: var(--ink);
          font-weight: 600;
          background: var(--accent-soft-strong);
          transform: translateX(2px);
        }
        .tc-toc__num {
          flex-shrink: 0;
          opacity: 0.75;
        }
        .tc-toc__link.is-active .tc-toc__num { color: var(--accent-2); opacity: 1; }

        /* Mobile TOC */
        .tc-toc-mobile { display: none; }
        @media (max-width: 760px) {
          .tc-toc { display: none; }
          .tc-toc-mobile {
            display: block;
            position: sticky;
            top: 0;
            z-index: 5;
            background: rgba(10, 14, 26, 0.92);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid var(--line);
          }
          .tc-toc-mobile__trigger {
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
          .tc-toc-mobile__chevron {
            transition: transform 0.25s ease;
            color: var(--accent-2);
          }
          .tc-toc-mobile__chevron.is-open { transform: rotate(180deg); }
          .tc-toc-mobile__panel {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 24px;
          }
          .tc-toc-mobile__panel.is-open {
            max-height: 420px;
            overflow-y: auto;
            padding-bottom: 12px;
          }
          .tc-toc-mobile__item {
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
          .tc-toc-mobile__item.is-active { color: var(--accent-2); font-weight: 600; }
        }

        .tc-sections { display: flex; flex-direction: column; gap: 4px; }
        .tc-section {
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          padding: 4px 20px;
          margin-bottom: 12px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s ease;
        }
        .tc-section.is-visible { opacity: 1; transform: translateY(0); }
        .tc-section:hover { border-color: var(--line-strong); }
        .tc-section__trigger {
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
        .tc-section__number {
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
        .tc-section__trigger:hover .tc-section__number {
          background: var(--accent-soft-strong);
          transform: scale(1.05);
        }
        .tc-section__title {
          flex: 1;
          font-size: 1.04rem;
          font-weight: 700;
          color: var(--ink);
          transition: color 0.2s ease;
        }
        .tc-section__trigger:hover .tc-section__title {
          color: var(--accent-2);
        }
        .tc-section__chevron {
          color: var(--ink-faint);
          transition: transform 0.3s ease, color 0.2s ease;
          flex-shrink: 0;
        }
        .tc-section__chevron.is-open { transform: rotate(180deg); color: var(--accent-2); }
        .tc-section__panel {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tc-section__divider {
          height: 1px;
          background: var(--line);
          margin: 0 0 18px 44px;
        }
        .tc-section__body {
          padding: 0 0 24px 44px;
          color: var(--ink-soft);
          font-size: 0.96rem;
          line-height: 1.7;
        }
        .tc-section__body p { margin: 0 0 12px; }
        .tc-section__body ul { margin: 0 0 12px; padding-left: 18px; }
        .tc-section__body li { margin-bottom: 10px; }
        .tc-section__body strong { color: var(--ink); }
        .tc-section__body a {
          color: var(--accent-2);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
          word-break: break-word;
        }
        .tc-section__body a:hover { color: var(--accent); }

        .tc-footnote {
          margin-top: 20px;
          padding: 18px 20px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          color: var(--ink-faint);
          font-size: 0.85rem;
        }
        .tc-footnote a { color: var(--accent-2); }

        .tc-top {
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
        .tc-top.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .tc-top:hover {
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
          .tc-hero, .tc-section, .tc-section__chevron, .tc-section__number,
          .tc-section__panel, .tc-toc__link, .tc-toc-mobile__panel, .tc-top {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="tc-hero">
        <nav className="tc-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Legal</span>
          <span>›</span>
          <strong>Terms &amp; Conditions</strong>
        </nav>

        <span className="tc-hero__eyebrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M6 2h9l5 5v15H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Legal Terms &amp; Agreements
        </span>

        <h1>Terms and Conditions of Use</h1>
        <p className="tc-hero__lede">
          Please carefully read these Terms before accessing or using the services of{' '}
          {brandName}. They govern your access to and use of our website, applications, software
          products, and consulting services.
        </p>

        <div className="tc-hero__meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span><strong>Last updated:</strong> September 10, 2026</span>
          <span className="tc-hero__dotsep" />
          <span>Platform Legal Notice</span>
        </div>

        <div className="tc-hero__warning">
          By visiting, browsing, registering for, or transacting on the Platform, you acknowledge
          that you have read, understood, and agreed to be bound by these Terms in full.
        </div>
      </div>

      <div className="tc-toc-mobile">
        <button
          type="button"
          className="tc-toc-mobile__trigger"
          aria-expanded={tocOpen}
          onClick={() => setTocOpen((o) => !o)}
        >
          {activeIndex >= 0 ? `${SECTIONS[activeIndex].number}. ${SECTIONS[activeIndex].title}` : 'Contents'}
          <span className={`tc-toc-mobile__chevron${tocOpen ? ' is-open' : ''}`}>
            <svg width="12" height="8" viewBox="0 0 14 9" fill="none">
              <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <div className={`tc-toc-mobile__panel${tocOpen ? ' is-open' : ''}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`tc-toc-mobile__item${activeId === s.id ? ' is-active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.number}. {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="tc-layout">
        <nav className="tc-toc" aria-label="Table of contents">
          <div className="tc-toc__card">
            <div className="tc-toc__heading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Table of contents
            </div>
            <div className="tc-toc__scroll">
              <ul className="tc-toc__list">
                {SECTIONS.map((s) => (
                  <li key={s.id} className="tc-toc__item">
                    <button
                      className={`tc-toc__link${activeId === s.id ? ' is-active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="tc-toc__num">{s.number}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        <div className="tc-sections">
          {SECTIONS.map((s, i) => (
            <Section key={s.id} section={s} brand={brandName} defaultOpen={i === 0} index={i} />
          ))}

          <p className="tc-footnote">
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:support@appnix.info">support@appnix.info</a>.
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`tc-top${showTop ? ' is-visible' : ''}`}
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