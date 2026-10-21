import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";
import JsonLd from '../JsonLd.jsx';
import { createBreadcrumbSchema } from '../../utils/seoSchemas.js';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import './public-landing.css';
import './marketing-pages.css';
import styles from './legal-pages.module.css';
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

export default function RefundPolicy() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Appnix CRM Pro';

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Refund & Cancellation Policy', url: 'https://www.appnix.info/refund-policy' },
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className={`crm-marketing ${styles.page}`}>
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
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.appnix.info/refund-policy" />
      </Helmet>
      <JsonLd schema={breadcrumbSchema} />

      <Navbar variant="product" />

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>
            Billing &amp; Refunds
          </div>
          <h1>
            Refund and Cancellation Policy
          </h1>
          <p>
            Understand our refund and cancellation terms.
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
              <p>Billing questions?</p>
              <p>
                Contact us at{' '}
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
