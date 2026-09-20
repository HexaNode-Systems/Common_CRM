import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar.jsx';
import Footer from '../components/landing/Footer.jsx';
import StickyContactButtons from '../components/landing/StickyContactButtons.jsx';
import JsonLd from '../components/JsonLd.jsx';
import Button from '../components/Button.jsx';
import { createBreadcrumbSchema, createFaqSchema } from '../utils/seoSchemas.js';
import {
  MessageCircle,
  Shield,
  Users,
  KanbanSquare,
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  ChevronDown,
  Layers
} from 'lucide-react';

const FAQS = [
  {
    question: 'How does user-level conversation isolation work on a shared number?',
    answer: 'Each sales representative only sees the chats and leads assigned to them. Managers retain administrative oversight across all chats, but individual reps cannot view other reps\' private customer conversations.'
  },
  {
    question: 'Is Appnix CRM Pro built for bulk WhatsApp broadcasting or spamming?',
    answer: 'No. Appnix CRM Pro is a sales CRM designed for 1-on-1 customer conversations, lead tracking, and pipeline execution. It is not a bulk blast or cold spamming tool.'
  },
  {
    question: 'Can multiple sales reps use the same business WhatsApp number?',
    answer: 'Yes. Your team connects a shared business number, and conversations are distributed to specific team members based on lead assignment.'
  },
  {
    question: 'Can I convert a WhatsApp conversation into a project when the deal closes?',
    answer: 'Yes. Once a lead is marked as won, you can instantly transition the client into an active project with assigned tasks and document storage.'
  }
];

export default function WhatsAppCrmPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.appnix.info/' },
    { name: 'WhatsApp CRM', url: 'https://www.appnix.info/whatsapp-crm' },
  ]);

  const faqSchema = createFaqSchema(FAQS);

  return (
    <div className="min-h-screen bg-white font-theme flex flex-col">
      <Helmet>
        <title>WhatsApp CRM for Sales Teams | Appnix CRM Pro</title>
        <meta
          name="description"
          content="Manage WhatsApp leads without losing context. Appnix CRM Pro provides isolated team inboxes on shared numbers, Kanban pipelines, and conversation ownership."
        />
        <link rel="canonical" href="https://www.appnix.info/whatsapp-crm" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="WhatsApp CRM for Sales Teams | Appnix CRM Pro" />
        <meta
          property="og:description"
          content="Manage WhatsApp leads without losing context. Appnix CRM Pro provides isolated team inboxes on shared numbers, Kanban pipelines, and conversation ownership."
        />
        <meta property="og:url" content="https://www.appnix.info/whatsapp-crm" />
        <meta property="og:image" content="https://www.appnix.info/logo-favicon.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="WhatsApp CRM for Sales Teams | Appnix CRM Pro" />
        <meta
          name="twitter:description"
          content="Manage WhatsApp leads without losing context. Appnix CRM Pro provides isolated team inboxes on shared numbers, Kanban pipelines, and conversation ownership."
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
            <span className="text-slate-800 font-medium">WhatsApp CRM</span>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 lg:py-24 text-white">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                WhatsApp CRM · Sales &amp; Follow-ups
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                WhatsApp CRM for Sales Teams
              </h1>
              <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-2xl">
                Run your sales conversations from one unified WhatsApp workspace. Each sales representative manages their own assigned conversations, updates Kanban deal stages, and closes deals without message overlap or lost context.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/login">
                  <Button className="px-6 py-3 text-sm shadow-lg shadow-primary/30">
                    Start free trial
                  </Button>
                </Link>
                <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors">
                  View plans &amp; pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> User-level chat isolation
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Shared business number
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Visual Kanban pipeline
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Manage WhatsApp Leads Without Losing Context */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Contextual Messaging</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Manage WhatsApp Leads Without Losing Context
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                When sales reps use personal WhatsApp numbers or unstructured groups, customer context disappears the moment a rep is busy or leaves the team. Appnix CRM Pro centralizes conversation history so your business owns the client relationship, not personal phones.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">Complete Chat History</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Every interaction, customer query, and quote shared on WhatsApp remains attached to the lead record. Any authorized team member or manager can review past touchpoints instantly.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">Contact Notes &amp; Deal Tags</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Add internal notes, budget details, and deal requirements alongside active chats. Keep team discussions organized without exposing internal notes to the client.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">Quick Response Handling</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Respond rapidly to incoming inquiries with pre-formatted replies for pricing, proposals, and scheduling, ensuring consistent brand communication across your sales team.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: How Appnix WhatsApp CRM Works (Workflow) */}
        <section className="py-20 bg-slate-50/70 border-y border-slate-200/60">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Proven Process</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How Appnix WhatsApp CRM Works
              </h2>
              <p className="mt-4 text-base text-slate-600">
                From first greeting to closed deal and delivery, every step follows a structured sales flow.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { step: '01', title: 'Incoming Conversation', desc: 'A customer reaches out on your verified business WhatsApp number.' },
                { step: '02', title: 'Lead Creation', desc: 'The contact is automatically logged with their phone number and initial message.' },
                { step: '03', title: 'Lead Assignment', desc: 'The lead is assigned to a specific sales representative based on territory or capacity.' },
                { step: '04', title: 'Isolated Handling', desc: 'The assigned rep replies directly from their personal Appnix inbox view.' },
                { step: '05', title: 'Pipeline Stage Update', desc: 'As talks progress, the deal moves through New, In Talk, and Proposal stages.' },
                { step: '06', title: 'Won & Delivery Handoff', desc: 'Once won, the lead transitions into an active delivery project in the same workspace.' },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                    Step {s.step}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: One Business Number, Controlled Conversation Access */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">User-Level Isolation</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-tight">
                  One Business Number, Controlled Conversation Access
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  In traditional shared inboxes, every team member sees every incoming message. For sales teams, this creates confusion, duplicate replies, and privacy risks.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Zero Message Leakage</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Each sales rep only sees their own assigned chats. Customer details and negotiations remain protected.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Full Manager Oversight</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Supervisors and admins maintain holistic visibility across all reps' conversations for coaching, auditing, and quality control.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Clear Responsibility</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        There is never any ambiguity about who is responsible for replying to an incoming lead.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        WA
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Official Business Number</p>
                        <p className="text-[11px] text-slate-500">+91 77539 83175</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-xl border border-primary/20 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">Lead: Acme Retail</span>
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          Assigned: Rep A
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">"Sent quote for Starter tier. Awaiting review."</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">Lead: Studio North</span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Assigned: Rep B
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">"Follow-up call scheduled tomorrow at 11 AM."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Turn WhatsApp Conversations Into Sales Pipeline */}
        <section className="py-20 bg-slate-50/70 border-t border-slate-200/60">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
                    <span>Kanban Sales Pipeline</span>
                    <span className="text-primary font-bold">Appnix CRM Pro</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                      <p className="text-[11px] font-bold text-slate-700">New</p>
                      <div className="mt-2 rounded-lg bg-white p-2 border border-slate-200 text-[10px] shadow-2xs">
                        <p className="font-semibold text-slate-800">Apex Media</p>
                        <p className="text-slate-500">₹1,50,000</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-indigo-50/40 p-3 border border-indigo-100">
                      <p className="text-[11px] font-bold text-indigo-950">In Talk</p>
                      <div className="mt-2 rounded-lg bg-white p-2 border border-indigo-200 text-[10px] shadow-2xs">
                        <p className="font-semibold text-slate-800">Loom Studio</p>
                        <p className="text-indigo-600 font-medium">₹2,40,000</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-emerald-50/40 p-3 border border-emerald-100">
                      <p className="text-[11px] font-bold text-emerald-950">Proposal</p>
                      <div className="mt-2 rounded-lg bg-white p-2 border border-emerald-200 text-[10px] shadow-2xs">
                        <p className="font-semibold text-slate-800">Fernway Co</p>
                        <p className="text-emerald-600 font-medium">₹4,80,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 order-1 lg:order-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Pipeline Alignment</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Turn WhatsApp Conversations Into Sales Pipeline
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Messaging apps aren't designed to track sales velocity. Appnix bridges WhatsApp chats directly with your Kanban board so reps can update deal statuses as conversations evolve.
                </p>
                <div className="mt-6">
                  <Link to="/lead-management" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    Explore our Lead Management &amp; Pipeline features
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Why Use a WhatsApp CRM Instead of Separate Tools? */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Why Use a WhatsApp CRM Instead of Separate Tools?
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Operating across personal WhatsApp accounts, Excel sheets, and separate task boards leads to missed follow-ups and lost revenue.
              </p>
            </div>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-4 px-6">Feature / Capability</th>
                    <th className="py-4 px-6 text-slate-500">Personal WhatsApp + Excel</th>
                    <th className="py-4 px-6 text-primary">Appnix CRM Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-800">Chat History Ownership</td>
                    <td className="py-4 px-6 text-slate-500">Stored on rep's phone (lost if rep leaves)</td>
                    <td className="py-4 px-6 font-semibold text-emerald-700">Centralized on company workspace</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-800">Lead Assignment</td>
                    <td className="py-4 px-6 text-slate-500">Manual copy-paste into spreadsheets</td>
                    <td className="py-4 px-6 font-semibold text-emerald-700">Assigned directly to reps with isolated access</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-800">Sales Pipeline Stages</td>
                    <td className="py-4 px-6 text-slate-500">Static rows, rarely updated</td>
                    <td className="py-4 px-6 font-semibold text-emerald-700">Visual Kanban board with automated logging</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-800">Post-Sale Delivery Handoff</td>
                    <td className="py-4 px-6 text-slate-500">Disconnected task tools or email threads</td>
                    <td className="py-4 px-6 font-semibold text-emerald-700">Direct conversion into project delivery tasks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 6: FAQ */}
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

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white text-center">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to organize your WhatsApp sales workflow?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Get started with Appnix CRM Pro today. Connect your number, assign conversations, and manage your pipeline from one workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/login">
                <Button className="px-6 py-3 text-sm shadow-lg shadow-primary/30">
                  Start free trial
                </Button>
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Talk to sales
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                See pricing
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
