import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import {
  Sparkles, MessageCircle, Users, KanbanSquare, Vault, Menu, X,
  ArrowRight, CheckCircle2, ShieldCheck, Lock, Fingerprint,
  BarChart3, TrendingUp, Clock, Building2, GraduationCap,
  Stethoscope, ShoppingBag, Briefcase, Cloud, ChevronDown,
  Star, Zap, Filter, UploadCloud,
} from 'lucide-react';

/* ---------------------------------------------------------------- */
/*  Shared bits                                                      */
/* ---------------------------------------------------------------- */

function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Navbar                                                            */
/* ---------------------------------------------------------------- */

function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'Industries', href: '#industries' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md font-theme">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          {settings?.brand?.logo ? (
            <img src={settings.brand.logo} alt={settings?.brand?.name || 'CRM'} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </span>
          )}
          <span className="text-lg font-bold tracking-tight text-slate-900">
            {settings?.brand?.name || 'Common CRM'}
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Sign in
          </Link>
          <Link to="/login">
            <Button className="text-sm">Get started</Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link to="/login" className="text-sm font-semibold text-slate-700">Sign in</Link>
              <Link to="/login"><Button className="w-full justify-center text-sm">Get started</Button></Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- */
/*  Hero + dashboard mockup                                          */
/* ---------------------------------------------------------------- */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-theme">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-12 lg:pt-28">
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Built for sales-led teams
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            One workspace for every lead, chat and deal your team touches.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
            Track leads, reply on WhatsApp, run projects and manage your whole team from a single
            dashboard — instead of five disconnected tools that never agree with each other.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/login">
              <Button className="px-6 py-3 text-sm shadow-lg shadow-primary/30">
                Start free trial
              </Button>
            </Link>
            <a href="#product" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-200">
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Live in one day</span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 px-2 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="rounded-xl bg-white p-5">
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Open leads', value: '128', tone: 'text-primary' },
                  { label: 'Running projects', value: '14', tone: 'text-indigo-600' },
                  { label: 'Unread chats', value: '9', tone: 'text-amber-600' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className={`text-xl font-bold ${s.tone}`}>{s.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'Aarav Mehta', stage: 'Negotiation', color: 'bg-amber-100 text-amber-700' },
                  { name: 'Riya Kapoor', stage: 'Won', color: 'bg-emerald-100 text-emerald-700' },
                  { name: 'Studio North', stage: 'New enquiry', color: 'bg-sky-100 text-sky-700' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {row.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{row.name}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.color}`}>{row.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Trust strip                                                      */
/* ---------------------------------------------------------------- */

function TrustBar() {
  const names = ['Northbridge Realty', 'Vantage Clinics', 'Studio Loom', 'Craft & Co.', 'Beacon Academy', 'Fernway Agency'];
  return (
    <section className="border-b border-slate-100 bg-white py-10 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          Trusted by growing teams across industries
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((n) => (
            <span key={n} className="text-sm font-semibold text-slate-400">{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Problem                                                           */
/* ---------------------------------------------------------------- */

function Problem() {
  const points = [
    { title: 'Leads go cold in spreadsheets', body: 'By the time someone follows up, the enquiry is three days old and already talking to a competitor.' },
    { title: 'WhatsApp replies get lost', body: 'Conversations live on personal phones with no record of who said what, or who owns the follow-up.' },
    { title: 'No one sees the full picture', body: 'Sales, delivery and finance each work off their own tool, so nothing lines up at the end of the month.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="The problem"
          title="Most teams don't lose deals to competitors. They lose them to gaps."
          description="Common CRM closes the gap between a first enquiry and a closed deal by keeping every conversation, task and document in one place."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Core features (bento grid)                                       */
/* ---------------------------------------------------------------- */

function CoreFeatures() {
  return (
    <section id="features" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Core features"
          title="Everything a sales and delivery team needs, built in"
          description="No separate subscriptions for chat, tasks and reporting — it's one system that already knows how your business works."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white lg:col-span-2 lg:row-span-2">
            <KanbanSquare className="h-8 w-8 text-indigo-300" />
            <h3 className="mt-5 text-xl font-bold">Lead management, end to end</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Capture enquiries from every channel, assign them automatically, and track each one
              through a pipeline your team actually agrees on — from first contact to signed deal.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-300" /> Auto-assignment by territory or workload</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-300" /> Custom pipeline stages per team</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-300" /> Serial-numbered lead tracking</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <MessageCircle className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">WhatsApp, per user</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every team member sees only their own chats and messages — strictly isolated, with a full history attached to the lead.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <Users className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Team &amp; capacity</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              See who's overloaded before you assign the next project, with soft warnings on over-allocation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 lg:col-span-2">
            <Vault className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Documents &amp; storage, organized by project</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Agreements, invoices and files sorted automatically by category, with safe filenames and a document viewer built for bulk uploads.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Reporting</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Real-time visibility into pipeline value, budgets and team output — no exports required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Product showcase (alternating rows)                              */
/* ---------------------------------------------------------------- */

function ShowcaseRow({ reverse, icon: Icon, eyebrow, title, body, bullets, mock }) {
  return (
    <div className={`grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-5 text-sm font-semibold text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">{mock}</div>
    </div>
  );
}

function ProductShowcase() {
  return (
    <section id="product" className="bg-white py-8 font-theme">
      <div className="mx-auto max-w-7xl divide-y divide-slate-100 px-6">
        <ShowcaseRow
          icon={KanbanSquare}
          eyebrow="Lead management"
          title="A pipeline your whole team actually looks at"
          body="Filter by owner, stage or date range and find any lead in seconds. Every field is searchable, every status change is logged."
          bullets={['Debounced global search across name, company and email', 'Color-coded status at a glance', 'Serial-numbered records for easy reference']}
          mock={
            <div className="space-y-2">
              {['Pipeline', 'Running', 'Finished'].map((s, i) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-medium text-slate-700">{s}</span>
                  <span className="text-sm font-semibold text-slate-400">{[18, 26, 41][i]} leads</span>
                </div>
              ))}
            </div>
          }
        />

        <ShowcaseRow
          reverse
          icon={MessageCircle}
          eyebrow="WhatsApp built in"
          title="Chats stay attached to the lead — and to the right person"
          body="Message isolation means one team member's conversations never leak into another's inbox, even on shared numbers."
          bullets={['Strict per-user chat and message isolation', 'Full conversation history on every lead', 'No more screenshots forwarded on Slack']}
          mock={
            <div className="space-y-2">
              <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
                Sending the proposal now, thanks for waiting!
              </div>
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                Perfect, looking forward to it.
              </div>
            </div>
          }
        />

        <ShowcaseRow
          icon={Users}
          eyebrow="Team management"
          title="Assign work without guessing who has room for it"
          body="Multi-select team members onto a project and get a live capacity check before you commit anyone to a deadline."
          bullets={['Automatic allocation checks across running projects', 'Soft warnings instead of hard blocks', 'Role-based permissions for admin, manager and user']}
          mock={
            <div className="flex -space-x-2">
              {['AK', 'RS', 'MJ', 'PV'].map((i) => (
                <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary/90 text-xs font-semibold text-white">
                  {i}
                </span>
              ))}
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600">+3</span>
            </div>
          }
        />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  How it works                                                     */
/* ---------------------------------------------------------------- */

function HowItWorks() {
  const steps = [
    { title: 'Set up your workspace', body: 'Add your brand, colors and team in minutes — no developer needed.' },
    { title: 'Import your leads', body: 'Bring in existing contacts and enquiries from a spreadsheet or your old tool.' },
    { title: 'Connect WhatsApp', body: 'Link your business number so every chat lands against the right lead.' },
    { title: 'Track and grow', body: 'Watch pipeline, projects and team capacity from one live dashboard.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="How it works" title="Live in a day, not a quarter" align="center" />
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <span className="text-4xl font-extrabold text-primary/20">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Industries                                                       */
/* ---------------------------------------------------------------- */

function Industries() {
  const industries = [
    { name: 'Real estate', icon: Building2 },
    { name: 'Education', icon: GraduationCap },
    { name: 'Healthcare', icon: Stethoscope },
    { name: 'Retail', icon: ShoppingBag },
    { name: 'Agencies', icon: Briefcase },
    { name: 'SaaS teams', icon: Cloud },
  ];
  return (
    <section id="industries" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Industries" title="Configured for how your business already sells" description="The same core system, themed and structured for your industry's pipeline and vocabulary." />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {industries.map(({ name, icon: Icon }) => (
            <div key={name} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 px-4 py-8 text-center transition-colors hover:border-primary/40">
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold text-slate-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Analytics                                                        */
/* ---------------------------------------------------------------- */

function Analytics() {
  const bars = [40, 65, 50, 80, 60, 90, 72];
  return (
    <section className="bg-slate-950 py-24 font-theme">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
            <TrendingUp className="h-5 w-5" />
          </span>
          <p className="mt-5 text-sm font-semibold text-indigo-300">Analytics</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Know where every deal and every hour went
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            Pipeline value, conversion by stage, team output and project budgets update live — no
            spreadsheet exports, no waiting for a monthly report.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">32%</p>
              <p className="mt-1 text-xs text-slate-400">Faster lead response</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">4.6x</p>
              <p className="mt-1 text-xs text-slate-400">More follow-ups logged</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Weekly closed value</span>
            <span className="flex items-center gap-1 text-emerald-400"><Clock className="h-3.5 w-3.5" /> Live</span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-300" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Integrations                                                     */
/* ---------------------------------------------------------------- */

function Integrations() {
  const tools = ['WhatsApp Business', 'Cloud storage', 'Email', 'Calendar', 'Payment gateways', 'Webhooks', 'CSV import/export', 'REST API'];
  return (
    <section className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Integrations" title="Fits into the tools you already use" align="center" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tools.map((t) => (
            <div key={t} className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-600">
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Security                                                         */
/* ---------------------------------------------------------------- */

function Security() {
  const items = [
    { icon: Lock, title: 'JWT authentication', body: 'Every session is signed and verified, with role checks on every request.' },
    { icon: Fingerprint, title: 'Per-user data isolation', body: 'WhatsApp chats and messages are strictly scoped to the user who owns them.' },
    { icon: ShieldCheck, title: 'Role-based permissions', body: 'Admins, managers and users each see exactly what their role allows.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Security" title="Access control that's strict by default" description="Data isolation isn't a setting you turn on — it's how the system is built." />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Pricing                                                           */
/* ---------------------------------------------------------------- */

function Pricing() {
  const plans = [
    { name: 'Starter', price: '₹1,999', period: '/month', desc: 'For small teams getting off spreadsheets.', features: ['Up to 5 users', 'Lead management', 'WhatsApp for 1 number', 'Email support'], highlight: false },
    { name: 'Growth', price: '₹5,999', period: '/month', desc: 'For teams running projects and multiple channels.', features: ['Up to 25 users', 'Everything in Starter', 'Projects & document storage', 'Team capacity checks', 'Priority support'], highlight: true },
    { name: 'Enterprise', price: 'Custom', period: '', desc: 'For larger orgs with custom workflows.', features: ['Unlimited users', 'Everything in Growth', 'Custom roles & permissions', 'Dedicated onboarding'], highlight: false },
  ];
  return (
    <section id="pricing" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Pricing" title="Simple plans that grow with your team" align="center" />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-8 ${p.highlight ? 'border-primary bg-primary/5 shadow-lg' : 'border-slate-200'}`}
            >
              {p.highlight && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-3 w-3" /> Most popular
                </span>
              )}
              <h3 className="mt-4 text-lg font-bold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
              <p className="mt-6 text-3xl font-extrabold text-slate-900">
                {p.price}<span className="text-base font-medium text-slate-400">{p.period}</span>
              </p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login">
                <Button className={`mt-8 w-full justify-center text-sm ${p.highlight ? '' : 'bg-slate-900 hover:bg-slate-800'}`}>
                  {p.name === 'Enterprise' ? 'Contact sales' : 'Start free trial'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Testimonials                                                     */
/* ---------------------------------------------------------------- */

function Testimonials() {
  const quotes = [
    { name: 'Meera Iyer', role: 'Founder, Studio Loom', quote: 'We stopped losing enquiries the week we switched. Everyone finally works off the same list.' },
    { name: 'Devansh Rao', role: 'Ops Lead, Fernway Agency', quote: 'The WhatsApp isolation alone saved us from three awkward conversations about who owns which client.' },
    { name: 'Ishita Sharma', role: 'Director, Vantage Clinics', quote: 'Project budgets and documents finally live in one place instead of six email threads.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Customers" title="Teams who used to work out of five tools" align="center" />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {quotes.map((q) => (
            <div key={q.name} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">&ldquo;{q.quote}&rdquo;</p>
              <p className="mt-5 text-sm font-semibold text-slate-900">{q.name}</p>
              <p className="text-xs text-slate-500">{q.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  FAQ                                                               */
/* ---------------------------------------------------------------- */

function FAQ() {
  const faqs = [
    { q: 'Can I bring in leads from my current spreadsheet?', a: 'Yes — import via CSV and we map the columns to your pipeline fields during setup.' },
    { q: 'Is WhatsApp messaging really isolated per user?', a: 'Yes. Each team member only ever sees the chats and messages assigned to them, even on a shared business number.' },
    { q: 'Can I change the branding for a client I manage this for?', a: 'Yes — brand name, logo, colors, fonts and content are all editable from Settings without touching code.' },
    { q: 'What happens if I outgrow the Starter plan?', a: 'You can upgrade at any time; your leads, projects and documents carry over with no migration needed.' },
  ];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions teams usually ask" align="center" />
        <div className="mt-10 divide-y divide-slate-100 border-t border-slate-100">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <p className="pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Final CTA                                                        */
/* ---------------------------------------------------------------- */

function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-24 font-theme">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Zap className="mx-auto h-8 w-8 text-indigo-300" />
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Bring your leads, chats and projects into one place today
        </h2>
        <p className="mt-4 text-base text-slate-300">
          Set up takes under a day. No credit card required to start.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button className="px-6 py-3 text-sm shadow-lg shadow-primary/30">Start free trial</Button>
          </Link>
          <a href="#faq" className="text-sm font-semibold text-white hover:text-slate-200">Read the FAQ</a>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Footer                                                            */
/* ---------------------------------------------------------------- */

function Footer() {
  const { settings } = useSettings();
  const columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Industries', 'Security'] },
    { title: 'Company', links: ['About', 'Contact', 'Careers'] },
    { title: 'Resources', links: ['FAQ', 'Support', 'API docs'] },
  ];
  return (
    <footer className="bg-slate-950 py-16 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-lg font-bold text-white">{settings?.brand?.name || 'Common CRM'}</span>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              One workspace for leads, WhatsApp and delivery.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-slate-400 hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {settings?.brand?.name || 'Common CRM'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- */
/*  Page                                                              */
/* ---------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-theme">
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />
      <CoreFeatures />
      <ProductShowcase />
      <HowItWorks />
      <Industries />
      <Analytics />
      <Integrations />
      <Security />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}