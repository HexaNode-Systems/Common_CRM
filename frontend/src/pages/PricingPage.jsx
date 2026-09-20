import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar.jsx';
import Footer from '../components/landing/Footer.jsx';
import StickyContactButtons from '../components/landing/StickyContactButtons.jsx';
import JsonLd from '../components/JsonLd.jsx';
import Button from '../components/Button.jsx';
import { useInquiry } from '../context/InquiryContext.jsx';
import { createBreadcrumbSchema, createFaqSchema } from '../utils/seoSchemas.js';
import {
  CheckCircle2,
  Star,
  ArrowRight,
  ChevronDown,
  Shield,
  X
} from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    price: '₹1,999',
    period: '/month',
    desc: 'For small teams getting off spreadsheets.',
    features: [
      'Up to 5 users',
      'Lead management',
      'WhatsApp for 1 number',
      'Email support'
    ],
    highlight: false,
    cta: 'Start free trial',
    ctaSource: 'pricing_page_starter_trial'
  },
  {
    name: 'Growth',
    price: '₹5,999',
    period: '/month',
    desc: 'For teams running projects and multiple channels.',
    features: [
      'Up to 25 users',
      'Everything in Starter',
      'Projects & document storage',
      'Team capacity checks',
      'Priority support'
    ],
    highlight: true,
    cta: 'Start free trial',
    ctaSource: 'pricing_page_growth_trial'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For larger orgs with custom workflows.',
    features: [
      'Unlimited users',
      'Everything in Growth',
      'Custom roles & permissions',
      'Dedicated onboarding'
    ],
    highlight: false,
    cta: 'Contact sales',
    ctaSource: 'pricing_page_enterprise_contact'
  },
];

const COMPARISON_ROWS = [
  { category: 'Team & User Capacity' },
  { name: 'User Seats Included', starter: 'Up to 5 users', growth: 'Up to 25 users', enterprise: 'Unlimited users' },
  { name: 'Role-Based Access Control', starter: 'Standard roles', growth: 'Standard roles', enterprise: 'Custom roles & permissions' },
  { name: 'Team Capacity & Workload Views', starter: false, growth: true, enterprise: true },
  
  { category: 'Lead & Pipeline Management' },
  { name: 'Multi-Channel Lead Capture', starter: true, growth: true, enterprise: true },
  { name: 'CSV Lead Import & Column Mapping', starter: true, growth: true, enterprise: true },
  { name: 'Visual Kanban Sales Pipeline', starter: true, growth: true, enterprise: true },
  { name: 'Deal Value & Velocity Tracking', starter: true, growth: true, enterprise: true },

  { category: 'WhatsApp Conversations' },
  { name: 'Connected Business Numbers', starter: '1 Number', growth: 'Multiple Numbers', enterprise: 'Custom Numbers' },
  { name: 'User-Level Conversation Isolation', starter: true, growth: true, enterprise: true },
  { name: 'Centralized Chat History', starter: true, growth: true, enterprise: true },

  { category: 'Project & Delivery Execution' },
  { name: 'Won Lead to Project Conversion', starter: false, growth: true, enterprise: true },
  { name: 'Task Management & Assignment', starter: false, growth: true, enterprise: true },
  { name: 'Document Vault & Storage', starter: false, growth: true, enterprise: true },

  { category: 'Support & Onboarding' },
  { name: 'Support Channel', starter: 'Email support', growth: 'Priority support', enterprise: 'Dedicated onboarding & support' },
  { name: 'Onboarding Assistance', starter: 'Self-guided', growth: 'Guided setup', enterprise: 'Dedicated onboarding' },
];

const FAQS = [
  {
    question: 'Can I upgrade my plan as my team grows?',
    answer: 'Yes. You can upgrade from Starter to Growth or Enterprise at any time. Your leads, pipeline history, and projects carry over seamlessly with zero migration needed.'
  },
  {
    question: 'Are there hidden fees for WhatsApp conversations?',
    answer: 'Appnix CRM Pro charges a flat platform subscription. Platform plans include support for your connected business numbers without hidden per-message markups from Appnix.'
  },
  {
    question: 'What is the refund policy for new subscriptions?',
    answer: 'First-time subscribers may request a refund within seven (7) calendar days of their initial purchase in accordance with our Refund Policy.'
  },
  {
    question: 'How does user licensing work?',
    answer: 'The Starter plan includes up to 5 users, Growth includes up to 25 users, and Enterprise supports unlimited user seats with custom role permissions.'
  }
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const { openInquiryModal } = useInquiry();

  const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Pricing', url: 'https://www.appnix.info/pricing' },
  ]);

  const faqSchema = createFaqSchema(FAQS);

  return (
    <div className="min-h-screen bg-white font-theme flex flex-col">
      <Helmet>
        <title>Appnix CRM Pro Pricing | CRM Plans</title>
        <meta
          name="description"
          content="Transparent pricing plans for Appnix CRM Pro. Compare Starter, Growth, and Enterprise tiers with user allowances, WhatsApp numbers, and features."
        />
        <link rel="canonical" href="https://www.appnix.info/pricing" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Appnix CRM Pro Pricing | CRM Plans" />
        <meta
          property="og:description"
          content="Transparent pricing plans for Appnix CRM Pro. Compare Starter, Growth, and Enterprise tiers with user allowances, WhatsApp numbers, and features."
        />
        <meta property="og:url" content="https://www.appnix.info/pricing" />
        <meta property="og:image" content="https://www.appnix.info/logo-favicon.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Appnix CRM Pro Pricing | CRM Plans" />
        <meta
          name="twitter:description"
          content="Transparent pricing plans for Appnix CRM Pro. Compare Starter, Growth, and Enterprise tiers with user allowances, WhatsApp numbers, and features."
        />
        <meta name="twitter:image" content="https://www.appnix.info/logo-favicon.png" />
      </Helmet>

      <JsonLd schema={breadcrumbs} />
      <JsonLd schema={faqSchema} />

      <Navbar />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-slate-50/70 py-3 px-6 text-xs text-slate-500">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Pricing</span>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 lg:py-24 text-white text-center">
          <div className="mx-auto max-w-4xl px-6 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-primary-light" />
              Transparent Pricing · No Hidden Fees
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Appnix CRM Pro Pricing
            </h1>
            <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Simple, predictable plans designed for growing sales teams. Manage leads, WhatsApp conversations, and delivery without surprise add-ons.
            </p>
          </div>
        </section>

        {/* Plan Cards Section */}
        <section className="py-20 bg-slate-50/70 border-b border-slate-200/60">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`flex h-full flex-col rounded-2xl border p-8 transition-all duration-200 bg-white ${
                    p.highlight
                      ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20'
                      : 'border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="h-6">
                    {p.highlight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        <Star className="h-3 w-3" /> Most popular
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">{p.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
                  <p className="mt-6 text-3xl font-extrabold text-slate-900">
                    {p.price}
                    <span className="text-base font-medium text-slate-400">{p.period}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-2">
                    <Button
                      onClick={() => openInquiryModal(p.ctaSource)}
                      className={`w-full justify-center text-sm ${
                        p.highlight ? 'shadow-md shadow-primary/20' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {p.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Feature Comparison Table */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Side-by-Side</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Detailed Plan Feature Comparison
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Compare capabilities across each tier to determine the best fit for your team.
              </p>
            </div>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-4 px-6 w-2/5">Feature</th>
                    <th className="py-4 px-6 text-center w-1/5">Starter</th>
                    <th className="py-4 px-6 text-center w-1/5 text-primary">Growth</th>
                    <th className="py-4 px-6 text-center w-1/5">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {COMPARISON_ROWS.map((row, idx) => {
                    if (row.category) {
                      return (
                        <tr key={row.category} className="bg-slate-50/80">
                          <td colSpan={4} className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-700">
                            {row.category}
                          </td>
                        </tr>
                      );
                    }

                    const renderCell = (val) => {
                      if (val === true) return <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />;
                      if (val === false) return <X className="h-4 w-4 text-slate-300 mx-auto" />;
                      return <span className="text-xs font-medium text-slate-700">{val}</span>;
                    };

                    return (
                      <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-medium text-slate-800">{row.name}</td>
                        <td className="py-3.5 px-6 text-center">{renderCell(row.starter)}</td>
                        <td className="py-3.5 px-6 text-center bg-primary/[0.02]">{renderCell(row.growth)}</td>
                        <td className="py-3.5 px-6 text-center">{renderCell(row.enterprise)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Billing Information & Policy Notes */}
        <section className="py-16 bg-slate-50 border-y border-slate-200/60">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-xl font-bold text-slate-900">Billing Terms &amp; Policies</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 leading-relaxed">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">Cancellation Policy</h3>
                <p className="mt-2 text-xs text-slate-600">
                  You may cancel your subscription at any time from your user dashboard. Cancellations take effect at the end of the current billing cycle. For complete details, review our{' '}
                  <Link to="/terms-and-conditions" className="text-primary hover:underline">
                    Terms &amp; Conditions
                  </Link>.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">7-Day Refund Grace Period</h3>
                <p className="mt-2 text-xs text-slate-600">
                  First-time subscribers may file a refund request within seven (7) calendar days of the initial subscription purchase. Read the full guidelines in our{' '}
                  <Link to="/refund-policy" className="text-primary hover:underline">
                    Refund &amp; Cancellation Policy
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: FAQ */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Got Questions?</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Pricing Frequently Asked Questions
              </h2>
            </div>

            <div className="mt-12 space-y-4">
              {FAQS.map((faq, idx) => (
                <div key={faq.question} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white text-center">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to simplify your CRM and WhatsApp workflows?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Start your free trial today or talk to our team for custom enterprise requirements.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => openInquiryModal('pricing_page_final_trial')}
                className="px-6 py-3 text-sm shadow-lg shadow-primary/30"
              >
                Start free trial
              </Button>
              <button
                type="button"
                onClick={() => openInquiryModal('pricing_page_final_contact')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Contact sales
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <StickyContactButtons />
    </div>
  );
}
