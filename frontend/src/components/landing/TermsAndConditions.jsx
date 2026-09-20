import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";
import JsonLd from '../JsonLd.jsx';
import { createBreadcrumbSchema } from '../../utils/seoSchemas.js';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

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

export default function TermsAndConditions() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Appnix CRM Pro';

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Terms and Conditions', url: 'https://www.appnix.info/terms-and-conditions' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-theme flex flex-col">
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
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.appnix.info/terms-and-conditions" />
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
            Terms and Conditions
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            The terms governing your use of Appnix CRM Pro.
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
              <p className="font-semibold text-slate-900">Questions about these Terms?</p>
              <p className="mt-1 text-slate-600">
                Contact our legal team at{' '}
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