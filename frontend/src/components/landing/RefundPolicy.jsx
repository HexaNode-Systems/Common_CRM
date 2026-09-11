import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";
const SECTIONS = [
  {
    id: 'general-principle',
    number: '1',
    title: 'General Principle',
    body: () => (
      <p>
        When purchasing software products, subscriptions, or specialized technical services via{' '}
        <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
          www.appnix.info
        </a>
        , you receive instant, irrevocable access to intellectual assets, specialized developer
        allocation, or computational resources. For this reason, all transactions are presumed
        final, except under the explicit scenarios detailed in this policy.
      </p>
    ),
  },
  {
    id: 'subscription-services-and-cancellations',
    number: '2',
    title: 'Subscription Services & Cancellations',
    body: () => (
      <>
        <h4>A. Ongoing subscriptions</h4>
        <ul>
          <li>
            <strong>Self-service cancellation.</strong> You may cancel recurring software
            subscriptions or SaaS tier renewals at any time via your user dashboard under Account
            Settings or by emailing <a href="mailto:support@appnix.info">support@appnix.info</a>.
          </li>
          <li>
            <strong>Effective cancellation date.</strong> Once submitted, your cancellation will
            take effect at the close of your current active billing cycle. You will retain
            uninterrupted access to your account tools until that cycle terminates.
          </li>
          <li>
            <strong>Renewal charges.</strong> We do not process retroactive or prorated refunds
            for partially elapsed subscription billing cycles. To avoid automated recurring
            charges, you must initiate cancellation at least 48 hours prior to your subsequent
            billing renewal date.
          </li>
        </ul>
        <h4>B. First-time purchase refund grace period</h4>
        <p>
          If you are a first-time subscriber to a recurring platform plan and determine that the
          product does not align with your professional requirements, you may file a refund
          request within seven (7) calendar days of the initial subscription purchase. Upon
          evaluation, a refund may be issued, minus administrative or transaction gateway charges.
          This window does not apply to subsequent renewal cycles.
        </p>
      </>
    ),
  },
  {
    id: 'digital-products-and-software-licenses',
    number: '3',
    title: 'Digital Products and Software Licenses',
    body: () => (
      <ul>
        <li>
          <strong>Access and keys.</strong> Once software licenses, proprietary source code,
          digital downloads, or product credentials have been accessed, unsealed, generated, or
          transmitted to you, the purchase is non-refundable.
        </li>
        <li>
          <strong>Technical defects.</strong> If you experience critical technical defects that
          completely prevent the software or tool from functioning as specified in the platform
          documentation, you must inform our engineering team within five (5) days of discovery,
          providing diagnostic logs, error screenshots, and system details.
        </li>
        <li>
          <strong>Correction and redress.</strong> Our technical support team shall be given a
          minimum of seven (7) business days to rectify the defect or deploy a patch. If the flaw
          cannot be resolved and renders the product wholly unusable, we will authorize a complete
          or partial refund at our sole technical discretion.
        </li>
      </ul>
    ),
  },
  {
    id: 'professional-and-custom-development-services',
    number: '4',
    title: 'Professional & Custom Development Services',
    body: (brand) => (
      <>
        <p>
          For customized development, IT consulting, tailored configurations, and
          milestone-driven technical implementations:
        </p>
        <ul>
          <li>
            <strong>Project setup / initial deposits.</strong> All initial onboarding fees,
            retainer deposits, and exploratory project payments are non-refundable, as they offset
            immediate resource allocation, project management, and developer time.
          </li>
          <li>
            <strong>Milestone rejections.</strong> Refunds on custom projects are governed
            strictly by the written Master Services Agreement (MSA) or Statement of Work (SOW)
            executed between the parties. Once a deliverable milestone has been reviewed,
            approved, or put into operational use, associated funds cannot be reclaimed.
          </li>
          <li>
            <strong>Mid-project cancellation.</strong> If you elect to cancel a custom engagement
            prior to full completion, you will remain liable for all accrued hours, completed
            milestones, and third-party fees spent up to the formal cancellation receipt
            timestamp.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'non-refundable-charges',
    number: '5',
    title: 'Non-Refundable Charges',
    body: () => (
      <>
        <p>Under no circumstances are the following items eligible for refund:</p>
        <ul>
          <li>Domain registrations, transfers, or renewal costs.</li>
          <li>Dedicated cloud hosting or VPS allocations provisioned specifically for your deployment.</li>
          <li>Third-party API usage fees, license passes, or platform integration costs incurred on your behalf.</li>
          <li>Any services where terms of misuse, spamming, or community guideline violations resulted in immediate account suspension.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'refund-application-procedure',
    number: '6',
    title: 'Refund Application Procedure',
    body: () => (
      <>
        <p>
          To submit a formal refund claim, send a written inquiry to{' '}
          <a href="mailto:support@appnix.info">support@appnix.info</a> containing the following
          verifiable information:
        </p>
        <ul>
          <li>Subject line: "REFUND CLAIM – [Your Order/Invoice ID]".</li>
          <li>Full name and registered email address associated with the purchase.</li>
          <li>Date of transaction and total amount billed.</li>
          <li>
            A detailed, articulate justification outlining why the service or deliverable failed
            to satisfy service specifications, including logs or error output.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'evaluation-and-settlement-timelines',
    number: '7',
    title: 'Evaluation and Settlement Timelines',
    body: () => (
      <ul>
        <li>
          <strong>Review period.</strong> Our support and billing departments will review your
          request within three to five (3–5) business days.
        </li>
        <li>
          <strong>Discretionary approval.</strong> We reserve the right to decline claims deemed
          fraudulent, abusive, or indicative of bad-faith manipulation.
        </li>
        <li>
          <strong>Disbursement method.</strong> Approved refunds are processed directly back to
          the original funding source (credit card, bank account, or digital gateway).
        </li>
        <li>
          <strong>Processing duration.</strong> Depending on your financial institution or credit
          provider, funds typically reflect on your account statement within five to ten (5–10)
          business days following our processing confirmation.
        </li>
      </ul>
    ),
  },
  {
    id: 'policy-modifications',
    number: '8',
    title: 'Policy Modifications',
    body: (brand) => (
      <p>
        {brand} reserves the authority to revise, supplement, or alter this Refund and
        Cancellation Policy at any time without prior individual notice. Revisions will be
        published directly to this page on{' '}
        <a href="https://www.appnix.info" target="_blank" rel="noreferrer">
          www.appnix.info
        </a>
        .
      </p>
    ),
  },
  {
    id: 'billing-inquiries',
    number: '9',
    title: 'Billing Inquiries',
    body: (brand) => (
      <p>
        For disputes or clarifications concerning fees, invoices, or cancellation requests,
        contact the {brand} Billing Team at{' '}
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
      className={`rp-section${visible ? ' is-visible' : ''}`}
      style={{ transitionDelay: visible ? `${Math.min(index, 4) * 60}ms` : '0ms' }}
    >
      <button
        type="button"
        className="rp-section__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="rp-section__number">{section.number.padStart(2, '0')}</span>
        <span className="rp-section__title">{section.title}</span>
        <span className={`rp-section__chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        className="rp-section__panel"
        style={{
          maxHeight: open ? panelRef.current?.scrollHeight ?? 4000 : 0,
        }}
      >
        <div className="rp-section__divider" />
        <div className="rp-section__body">{section.body(brand)}</div>
      </div>
    </section>
  );
}

export default function RefundPolicy() {
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
    <div className={`rp-page${mounted ? ' is-mounted' : ''}`}>


<Helmet>
  <title>Refund & Cancellation Policy | Appnix CRM Pro</title>

  <meta
    name="description"
    content="Read Appnix CRM Pro's Refund and Cancellation Policy covering subscriptions, software licenses, custom development services, refunds, cancellations, and billing inquiries."
  />

  <meta
    name="keywords"
    content="Appnix refund policy, Appnix cancellation policy, CRM refund policy, SaaS refund policy, software cancellation policy, subscription refund, Appnix CRM"
  />

  <link rel="canonical" href="https://appnix.info/refund-policy" />
</Helmet>

      <div className="rp-progress" style={{ transform: `scaleX(${progress})` }} />
      <style>{`
        .rp-page {
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
        .rp-progress {
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
        .rp-hero {
          max-width: 920px;
          margin: 0 auto;
          padding: 64px 24px 32px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .rp-page.is-mounted .rp-hero {
          opacity: 1;
          transform: translateY(0);
        }
        .rp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--ink-faint);
          margin: 0 0 20px;
        }
        .rp-breadcrumb strong { color: var(--ink-soft); font-weight: 500; }
        .rp-hero__eyebrow {
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
        .rp-hero__eyebrow svg { flex-shrink: 0; }
        .rp-hero h1 {
          font-family: -apple-system, "Inter", "Segoe UI", sans-serif;
          font-size: clamp(2rem, 4vw, 2.65rem);
          font-weight: 800;
          letter-spacing: -0.015em;
          margin: 0 0 14px;
          color: var(--ink);
        }
        .rp-hero p.rp-hero__lede {
          color: var(--ink-soft);
          font-size: 1.02rem;
          line-height: 1.65;
          max-width: 640px;
          margin: 0 0 22px;
        }
        .rp-hero__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 0.86rem;
          color: var(--ink-faint);
        }
        .rp-hero__meta svg { color: var(--accent-2); flex-shrink: 0; }
        .rp-hero__meta strong { color: var(--ink-soft); font-weight: 600; }
        .rp-hero__dotsep {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: var(--ink-faint);
          flex-shrink: 0;
        }
        .rp-layout {
          max-width: 920px;
          margin: 0 auto;
          padding: 8px 24px 96px;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 760px) {
          .rp-layout { grid-template-columns: 1fr; }
        }

        /* Desktop TOC */
        .rp-toc {
          position: sticky;
          top: 24px;
          display: block;
        }
        .rp-toc__card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px 16px;
        }
        .rp-toc__heading {
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
        .rp-toc__heading svg { color: var(--accent); flex-shrink: 0; }
        .rp-toc__scroll {
          max-height: min(56vh, 480px);
          overflow-y: auto;
          padding-right: 4px;
          margin-right: -4px;
        }
        .rp-toc__scroll::-webkit-scrollbar { width: 4px; }
        .rp-toc__scroll::-webkit-scrollbar-track { background: transparent; }
        .rp-toc__scroll::-webkit-scrollbar-thumb {
          background: var(--line-strong);
          border-radius: 999px;
        }
        .rp-toc__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .rp-toc__item { margin: 0 0 4px; }
        .rp-toc__link {
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
        .rp-toc__link:hover {
          color: var(--ink-soft);
          background: rgba(255, 255, 255, 0.04);
        }
        .rp-toc__link.is-active {
          color: var(--ink);
          font-weight: 600;
          background: var(--accent-soft-strong);
          transform: translateX(2px);
        }
        .rp-toc__num {
          flex-shrink: 0;
          opacity: 0.75;
        }
        .rp-toc__link.is-active .rp-toc__num { color: var(--accent-2); opacity: 1; }

        /* Mobile TOC */
        .rp-toc-mobile { display: none; }
        @media (max-width: 760px) {
          .rp-toc { display: none; }
          .rp-toc-mobile {
            display: block;
            position: sticky;
            top: 0;
            z-index: 5;
            background: rgba(10, 14, 26, 0.92);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid var(--line);
          }
          .rp-toc-mobile__trigger {
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
          .rp-toc-mobile__chevron {
            transition: transform 0.25s ease;
            color: var(--accent-2);
          }
          .rp-toc-mobile__chevron.is-open { transform: rotate(180deg); }
          .rp-toc-mobile__panel {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 24px;
          }
          .rp-toc-mobile__panel.is-open {
            max-height: 420px;
            overflow-y: auto;
            padding-bottom: 12px;
          }
          .rp-toc-mobile__item {
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
          .rp-toc-mobile__item.is-active { color: var(--accent-2); font-weight: 600; }
        }

        .rp-sections { display: flex; flex-direction: column; gap: 4px; }
        .rp-section {
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          padding: 4px 20px;
          margin-bottom: 12px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s ease;
        }
        .rp-section.is-visible { opacity: 1; transform: translateY(0); }
        .rp-section:hover { border-color: var(--line-strong); }
        .rp-section__trigger {
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
        .rp-section__number {
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
        .rp-section__trigger:hover .rp-section__number {
          background: var(--accent-soft-strong);
          transform: scale(1.05);
        }
        .rp-section__title {
          flex: 1;
          font-size: 1.04rem;
          font-weight: 700;
          color: var(--ink);
          transition: color 0.2s ease;
        }
        .rp-section__trigger:hover .rp-section__title {
          color: var(--accent-2);
        }
        .rp-section__chevron {
          color: var(--ink-faint);
          transition: transform 0.3s ease, color 0.2s ease;
          flex-shrink: 0;
        }
        .rp-section__chevron.is-open { transform: rotate(180deg); color: var(--accent-2); }
        .rp-section__panel {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rp-section__divider {
          height: 1px;
          background: var(--line);
          margin: 0 0 18px 44px;
        }
        .rp-section__body {
          padding: 0 0 24px 44px;
          color: var(--ink-soft);
          font-size: 0.96rem;
          line-height: 1.7;
        }
        .rp-section__body h4 {
          color: var(--ink);
          font-size: 0.92rem;
          font-weight: 700;
          margin: 18px 0 8px;
        }
        .rp-section__body p { margin: 0 0 12px; }
        .rp-section__body ul { margin: 0 0 12px; padding-left: 18px; }
        .rp-section__body li { margin-bottom: 10px; }
        .rp-section__body strong { color: var(--ink); }
        .rp-section__body a {
          color: var(--accent-2);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
          word-break: break-word;
        }
        .rp-section__body a:hover { color: var(--accent); }

        .rp-footnote {
          margin-top: 20px;
          padding: 18px 20px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          color: var(--ink-faint);
          font-size: 0.85rem;
        }
        .rp-footnote a { color: var(--accent-2); }

        .rp-top {
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
        .rp-top.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .rp-top:hover {
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
          .rp-hero, .rp-section, .rp-section__chevron, .rp-section__number,
          .rp-section__panel, .rp-toc__link, .rp-toc-mobile__panel, .rp-top {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="rp-hero">
        <nav className="rp-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Legal</span>
          <span>›</span>
          <strong>Refund &amp; Cancellation</strong>
        </nav>

        <span className="rp-hero__eyebrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 10h18M3 6h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Billing &amp; Refunds
        </span>

        <h1>Refund and Cancellation Policy</h1>
        <p className="rp-hero__lede">
          We are dedicated to maintaining professional standards across our digital products,
          software licenses, and technical services. Because we deal primarily with digital
          solutions and access-based platforms, clear conditions govern service cancellation and
          financial reimbursement.
        </p>

        <div className="rp-hero__meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span><strong>Last updated:</strong> September 10, 2026</span>
          <span className="rp-hero__dotsep" />
          <span>Platform Legal Notice</span>
        </div>
      </div>

      <div className="rp-toc-mobile">
        <button
          type="button"
          className="rp-toc-mobile__trigger"
          aria-expanded={tocOpen}
          onClick={() => setTocOpen((o) => !o)}
        >
          {activeIndex >= 0 ? `${SECTIONS[activeIndex].number}. ${SECTIONS[activeIndex].title}` : 'Contents'}
          <span className={`rp-toc-mobile__chevron${tocOpen ? ' is-open' : ''}`}>
            <svg width="12" height="8" viewBox="0 0 14 9" fill="none">
              <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <div className={`rp-toc-mobile__panel${tocOpen ? ' is-open' : ''}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`rp-toc-mobile__item${activeId === s.id ? ' is-active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.number}. {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="rp-layout">
        <nav className="rp-toc" aria-label="Table of contents">
          <div className="rp-toc__card">
            <div className="rp-toc__heading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Table of contents
            </div>
            <div className="rp-toc__scroll">
              <ul className="rp-toc__list">
                {SECTIONS.map((s) => (
                  <li key={s.id} className="rp-toc__item">
                    <button
                      className={`rp-toc__link${activeId === s.id ? ' is-active' : ''}`}
                      onClick={() => scrollTo(s.id)}
                    >
                      <span className="rp-toc__num">{s.number}.</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        <div className="rp-sections">
          {SECTIONS.map((s, i) => (
            <Section key={s.id} section={s} brand={brandName} defaultOpen={i === 0} index={i} />
          ))}

          <p className="rp-footnote">
            Billing questions? Contact us at{' '}
            <a href="mailto:support@appnix.info">support@appnix.info</a>.
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`rp-top${showTop ? ' is-visible' : ''}`}
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