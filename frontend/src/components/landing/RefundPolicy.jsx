import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Helmet } from "react-helmet-async";
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-theme flex flex-col">
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

      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-16 sm:py-20 text-white text-center px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-light text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/30">
            Billing &amp; Refunds
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Refund and Cancellation Policy
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Understand our refund and cancellation terms.
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
              <p className="font-semibold text-slate-900">Billing questions?</p>
              <p className="mt-1 text-slate-600">
                Contact us at{' '}
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