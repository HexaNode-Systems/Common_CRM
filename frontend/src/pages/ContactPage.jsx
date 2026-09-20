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
  Mail,
  Phone,
  MessageCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Send
} from 'lucide-react';

const FAQS = [
  {
    question: 'How quickly can our team get started with Appnix CRM Pro?',
    answer: 'Most teams are live within one business day. Setup involves connecting your WhatsApp business number and importing your existing leads via CSV.'
  },
  {
    question: 'Can we schedule a product walkthrough?',
    answer: 'Yes. You can contact us via WhatsApp, phone (+91 7753983175), or email (support@appnix.info) to request a guided walkthrough of the CRM and WhatsApp inbox.'
  },
  {
    question: 'Where can I review plan pricing before contacting?',
    answer: 'You can view all plan tiers, user limits, and features on our Pricing page at https://www.appnix.info/pricing.'
  }
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const { openInquiryModal } = useInquiry();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamSize: '1-5',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Contact', url: 'https://www.appnix.info/contact' },
  ]);

  const faqSchema = createFaqSchema(FAQS);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Appnix Technologies',
    'url': 'https://www.appnix.info/',
    'logo': 'https://www.appnix.info/logo-favicon.png',
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+917753983175',
      'contactType': 'customer service',
      'email': 'support@appnix.info'
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Prepare prefilled WhatsApp message for immediate direct connection
    const text = `Hi Appnix Team, my name is ${formData.name}. Email: ${formData.email}, Phone: ${formData.phone}, Team Size: ${formData.teamSize}. Note: ${formData.message}`;
    const waUrl = `https://wa.me/917753983175?text=${encodeURIComponent(text)}`;
    // Open WhatsApp in new tab for direct consultation
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white font-theme flex flex-col">
      <Helmet>
        <title>Contact Appnix CRM Pro | Sales & Support</title>
        <meta
          name="description"
          content="Contact Appnix CRM Pro for product questions, sales enquiries and support. Connect with our team via phone, email or WhatsApp."
        />
        <link rel="canonical" href="https://www.appnix.info/contact" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Appnix CRM Pro | Sales & Support" />
        <meta
          property="og:description"
          content="Contact Appnix CRM Pro for product questions, sales enquiries and support. Connect with our team via phone, email or WhatsApp."
        />
        <meta property="og:url" content="https://www.appnix.info/contact" />
        <meta property="og:image" content="https://www.appnix.info/logo-favicon.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact Appnix CRM Pro | Sales & Support" />
        <meta
          name="twitter:description"
          content="Contact Appnix CRM Pro for product questions, sales enquiries and support. Connect with our team via phone, email or WhatsApp."
        />
        <meta name="twitter:image" content="https://www.appnix.info/logo-favicon.png" />
      </Helmet>

      <JsonLd schema={breadcrumbs} />
      <JsonLd schema={faqSchema} />
      <JsonLd schema={organizationSchema} />

      <Navbar />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-slate-50/70 py-3 px-6 text-xs text-slate-500">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Contact</span>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 lg:py-24 text-white text-center">
          <div className="mx-auto max-w-4xl px-6 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary-light" />
              Direct Sales &amp; Product Support
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Talk to Appnix CRM Pro
            </h1>
            <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Have questions about our WhatsApp CRM, lead management pipeline, or enterprise onboarding? Reach our team directly through our verified channels.
            </p>
          </div>
        </section>

        {/* Contact Channels Grid */}
        <section className="py-16 bg-slate-50/80 border-b border-slate-200/60">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Email */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-slate-900">Email Us</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Send detailed product queries or enterprise requirements.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a
                    href="mailto:support@appnix.info"
                    className="text-base font-semibold text-primary hover:underline flex items-center gap-2"
                  >
                    support@appnix.info
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-slate-900">Call Us</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Speak directly with a product specialist about your CRM setup.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a
                    href="tel:+917753983175"
                    className="text-base font-semibold text-indigo-600 hover:underline flex items-center gap-2"
                  >
                    +91 7753983175
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-slate-900">WhatsApp Chat</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Quick answers to your setup questions via direct WhatsApp messaging.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a
                    href="https://wa.me/917753983175"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-emerald-600 hover:underline flex items-center gap-2"
                  >
                    Chat on WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry Form & What Happens After Section */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Form Column */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Send an Inquiry or Request a Demo</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Tell us about your team and requirements. We'll connect with you to answer questions or arrange a walkthrough.
                  </p>

                  {submitted ? (
                    <div className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="mt-3 text-base font-bold text-emerald-950">Inquiry Initiated</h3>
                      <p className="mt-2 text-xs text-emerald-800">
                        WhatsApp was opened with your pre-filled inquiry. You can also reach us directly at{' '}
                        <a href="mailto:support@appnix.info" className="underline font-semibold">
                          support@appnix.info
                        </a>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="mt-4 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Submit another inquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="mt-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">Your Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            className="input text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="you@company.com"
                            className="input text-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">Phone (WhatsApp) *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            className="input text-sm"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">Team Size</label>
                          <select
                            className="input text-sm bg-white"
                            value={formData.teamSize}
                            onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                          >
                            <option value="1-5">1 - 5 users (Starter)</option>
                            <option value="6-25">6 - 25 users (Growth)</option>
                            <option value="25+">25+ users (Enterprise)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">Message / Inquiries</label>
                        <textarea
                          rows={4}
                          placeholder="Tell us about your current sales process or questions about WhatsApp integration..."
                          className="input text-sm resize-none"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                      </div>

                      <Button type="submit" className="w-full justify-center py-3 text-sm shadow-md shadow-primary/20">
                        <Send className="h-4 w-4 mr-2" />
                        Send Inquiry via WhatsApp
                      </Button>
                      <p className="text-[11px] text-slate-400 text-center">
                        Submitting opens WhatsApp with your pre-filled inquiry for immediate response.
                      </p>
                    </form>
                  )}
                </div>
              </div>

              {/* What Happens After Column */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Simple Next Steps</span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  What Happens After You Contact Us
                </h2>
                <div className="mt-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Requirement Review</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        We review your team size and workflow needs to recommend the right plan or configuration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Guided Walkthrough</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        We answer your questions over WhatsApp or phone and show you the isolated inbox and pipeline features.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Live in One Day</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Connect your WhatsApp number, import your leads from CSV, and start managing conversations from one workspace.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-5 rounded-xl border border-slate-200 bg-slate-50/80">
                  <p className="text-xs font-semibold text-slate-800">Need to see pricing first?</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Compare Starter, Growth, and Enterprise plans on our{' '}
                    <Link to="/pricing" className="text-primary font-semibold hover:underline">
                      Pricing page
                    </Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-slate-50/70 border-t border-slate-200/60">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Got Questions?</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Frequently Asked Questions
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
              Ready to see Appnix in action?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Start your free trial today or explore our WhatsApp CRM features.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => openInquiryModal('contact_page_final_trial')}
                className="px-6 py-3 text-sm shadow-lg shadow-primary/30"
              >
                Start free trial
              </Button>
              <Link to="/whatsapp-crm" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Explore WhatsApp CRM
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <StickyContactButtons />
    </div>
  );
}
