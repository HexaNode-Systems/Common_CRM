import { useEffect, useRef, useState } from 'react';
import { Helmet } from "react-helmet-async";
import JsonLd from '../JsonLd.jsx';
import { createBreadcrumbSchema } from '../../utils/seoSchemas.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import './public-landing.css';
import './marketing-pages.css';
import styles from './legal-pages.module.css';


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
    <div className={`crm-marketing ${styles.page}`}>
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

      <Navbar variant="product" />

      {/* Hero / Header */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>
            Appnix CRM Pro · Legal &amp; Compliance
          </span>
          <h1>
            Privacy Policy
          </h1>
          <p>
            How Appnix CRM Pro collects, uses and protects information.
          </p>
          <div className={styles.metadata}>
            <span>Last updated: September 10, 2026</span>
            <span>·</span>
            <span>Platform Legal Notice</span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Document Card */}
          <div className={styles.document}>
            {/* Quick Table of Contents */}
            <div className={styles.contents}>
              <p>
                Table of Contents
              </p>
              <div className={styles.contentsGrid}>
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={styles.contentsLink}
                  >
                    <span>{s.number}.</span>
                    <span>{s.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Legal Sections */}
            <div className={styles.sections}>
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className={styles.sectionHeading}>
                    <span className={styles.sectionNumber}>
                      {s.number}
                    </span>
                    <span>{s.title}</span>
                  </h2>
                  <div className={styles.body}>
                    {s.body(brandName)}
                  </div>
                </section>
              ))}
            </div>

            {/* Contact callout */}
            <div className={styles.callout}>
              <p>Questions about this policy?</p>
              <p>
                Contact our data protection desk at{' '}
                <a href="mailto:support@appnix.info">
                  support@appnix.info
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="product" />
    </div>
  );
}
