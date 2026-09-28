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
  KanbanSquare,
  FileSpreadsheet,
  Users,
  TrendingUp,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Globe,
  MessageCircle,
  PlusCircle,
  BarChart3
} from 'lucide-react';

const FAQS = [
  {
    question: 'How do I import my existing leads into Appnix CRM Pro?',
    answer: 'You can import your existing leads using a standard CSV file. During upload, you map your spreadsheet columns to Appnix pipeline fields such as contact name, phone number, email, and deal value.'
  },
  {
    question: 'What lead sources does Appnix CRM Pro support?',
    answer: 'Appnix supports CSV imports with field mapping, direct manual lead creation, web form submissions, and inbound WhatsApp conversations.'
  },
  {
    question: 'Can I customize the sales pipeline stages?',
    answer: 'Yes. You can configure pipeline stages to reflect your sales process, from initial contact to proposal review and deal closing.'
  },
  {
    question: 'What happens after a lead is marked as Won?',
    answer: 'When a deal closes successfully, you can convert the won lead directly into an operational project, complete with task management and document storage in the same workspace.'
  }
];

export default function LeadManagementPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const { openInquiryModal } = useInquiry();

  const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'Lead Management', url: 'https://www.appnix.info/lead-management' },
  ]);

  const faqSchema = createFaqSchema(FAQS);

  return (
    <div className="min-h-screen bg-white font-theme flex flex-col">
      <Helmet>
        <title>Lead Management Software | Appnix CRM Pro</title>
        <meta
          name="description"
          content="Capture leads from CSV, web forms, and WhatsApp. Appnix CRM Pro provides visual Kanban pipelines, automated stage tracking, and seamless project delivery handoff."
        />
        <link rel="canonical" href="https://www.appnix.info/lead-management" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Lead Management Software | Appnix CRM Pro" />
        <meta
          property="og:description"
          content="Capture leads from CSV, web forms, and WhatsApp. Appnix CRM Pro provides visual Kanban pipelines, automated stage tracking, and seamless project delivery handoff."
        />
        <meta property="og:url" content="https://www.appnix.info/lead-management" />
        <meta property="og:image" content="https://www.appnix.info/logo-favicon.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Lead Management Software | Appnix CRM Pro" />
        <meta
          name="twitter:description"
          content="Capture leads from CSV, web forms, and WhatsApp. Appnix CRM Pro provides visual Kanban pipelines, automated stage tracking, and seamless project delivery handoff."
        />
        <meta name="twitter:image" content="https://www.appnix.info/logo-favicon.webp" />
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
            <span className="text-slate-800 font-medium">Lead Management</span>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 lg:py-24 text-white">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
                <KanbanSquare className="h-3.5 w-3.5 text-sky-400" />
                Pipeline &amp; Deal Tracking
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                Lead Management Software for Growing Sales Teams
              </h1>
              <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-2xl">
                Stop losing deals in scattered spreadsheets. Capture leads from CSV imports, web forms, and WhatsApp, track every deal on a visual Kanban board, and convert won clients directly into delivery projects.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  onClick={() => openInquiryModal('lead_mgmt_hero_trial')}
                  className="px-6 py-3 text-sm shadow-lg shadow-primary/30"
                >
                  Start free trial
                </Button>
                <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors">
                  View plans &amp; pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> CSV column mapping
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Visual Kanban stages
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Post-sale project delivery
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Capture Leads From Multiple Sources */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Multi-Source Capture</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Capture Leads From Multiple Sources
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Appnix brings your customer inquiries together from verified channels so no potential deal slips through the cracks.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">CSV Spreadsheet Import</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Upload your existing customer databases with automatic column mapping for names, numbers, and deal values.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Website Web Forms</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Route inbound website inquiries directly into your sales pipeline without manual data entry.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">WhatsApp Inbound</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Inbound chats on your business number are captured as leads and routed to assigned sales representatives.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Manual Quick Entry</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sales reps can create leads in seconds after a phone call, networking event, or client walk-in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Import Existing Leads From CSV */}
        <section className="py-20 bg-slate-50/70 border-y border-slate-200/60">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Fast Migration</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Import Existing Leads From CSV in Minutes
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Moving off spreadsheets doesn't require days of manual copy-pasting. Appnix provides a native CSV import tool that lets you map your existing spreadsheet columns directly to pipeline fields.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Map contact names, phone numbers, and email addresses</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Assign deal values, initial stages, and notes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Zero data loss during team onboarding</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-700">
                    <span>CSV Field Mapping Preview</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Ready to Import</span>
                  </div>
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-500 font-mono">Column A: Customer Name</span>
                      <span className="font-semibold text-primary">→ Lead Name</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-500 font-mono">Column B: Phone Number</span>
                      <span className="font-semibold text-primary">→ Phone (WhatsApp)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-500 font-mono">Column C: Deal Amount</span>
                      <span className="font-semibold text-primary">→ Deal Value (INR)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-500 font-mono">Column D: Owner</span>
                      <span className="font-semibold text-primary">→ Assigned Rep</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Visual Kanban Sales Pipeline */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Kanban Board</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Visual Kanban Sales Pipeline
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Scan your entire sales pipeline in seconds. Drag leads between stages, filter by owner or date, and see where deals stand without asking for status reports.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-xs font-bold text-slate-800">New Leads</span>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-700">12</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-900">Acme Corp</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">₹1,20,000</p>
                    <span className="mt-2 inline-block text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Assigned: Sarah
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <span className="text-xs font-bold text-indigo-950">In Talk</span>
                  <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded font-semibold text-indigo-700">8</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-white p-3 border border-indigo-200/70 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-900">Studio Loom</p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">₹2,40,000</p>
                    <span className="mt-2 inline-block text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      WhatsApp Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-xs font-bold text-emerald-950">Proposal</span>
                  <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded font-semibold text-emerald-700">4</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-white p-3 border border-emerald-200/70 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-900">Fernway Co</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">₹4,80,000</p>
                    <span className="mt-2 inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Quote Sent
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between border-b border-emerald-300/70 pb-2">
                  <span className="text-xs font-bold text-emerald-950">Won / Project</span>
                  <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded font-semibold text-emerald-800">18</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-white p-3 border border-emerald-200 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-900">Horizon Tech</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">₹6,50,000</p>
                    <span className="mt-2 inline-block text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      Delivery Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: From Won Lead to Project Delivery */}
        <section className="py-20 bg-slate-50/70 border-y border-slate-200/60">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Post-Sale Execution</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  From Won Lead to Project Delivery in One Workspace
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Most CRMs end when a deal is marked "Won", forcing teams to manually re-enter client information into a separate project tool. Appnix CRM Pro bridges sales and delivery in the same platform.
                </p>
                <div className="mt-6 space-y-3 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Instant Project Creation</h3>
                      <p className="text-xs text-slate-600 mt-0.5">Convert closed deals into operational projects with one click.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Task Allocation &amp; Capacity</h3>
                      <p className="text-xs text-slate-600 mt-0.5">Distribute deliverables to execution team members based on workload.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Project Delivery Card</h3>
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Client: Horizon Tech</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">In Progress</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">Contract signed via WhatsApp. 4 delivery milestones scheduled.</p>
                    <div className="mt-4 border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Tasks: 3 / 5 Done</span>
                      <span className="font-semibold text-slate-700">Storage Vault: 2 Docs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section className="py-20 bg-white">
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
              Get full visibility over every lead and deal
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Bring your leads into a structured pipeline. Capture inquiries, track stage progress, and close deals faster.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => openInquiryModal('lead_mgmt_final_trial')}
                className="px-6 py-3 text-sm shadow-lg shadow-primary/30"
              >
                Start free trial
              </Button>
              <Link to="/whatsapp-crm" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Explore WhatsApp CRM
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                View pricing
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
