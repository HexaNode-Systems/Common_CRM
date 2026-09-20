import { useEffect, useRef, useState } from 'react';
import { Helmet } from "react-helmet-async";
import JsonLd from '../JsonLd.jsx';
import { createBreadcrumbSchema } from '../../utils/seoSchemas.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';


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

export default function PrivacyPolicy() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Appnix CRM Pro';

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Privacy Policy', url: 'https://www.appnix.info/privacy-policy' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-theme flex flex-col">
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
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.appnix.info/privacy-policy" />
      </Helmet>
      <JsonLd schema={breadcrumbSchema} />

      <Navbar />

      {/* Hero / Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-16 sm:py-20 text-white text-center px-6">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
            Appnix CRM Pro · Legal &amp; Compliance
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            How Appnix CRM Pro collects, uses and protects information.
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

            {/* Legal Sections */}
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
                    {s.body(brandName)}
                  </div>
                </section>
              ))}
            </div>

            {/* Contact callout */}
            <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Questions about this policy?</p>
              <p className="mt-1 text-slate-600">
                Contact our data protection desk at{' '}
                <a href="mailto:support@appnix.info" className="text-primary font-medium hover:underline">
                  support@appnix.info
                </a>.
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
        .legal-body table {
          width: 100%;
          margin: 1rem 0;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
        }
        .legal-body th, .legal-body td {
          padding: 0.625rem 0.75rem;
          border: 1px solid #e2e8f0;
          text-align: left;
        }
        .legal-body th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}