import { useEffect, useMemo, useState, memo } from 'react';
import { api } from '../api/client.js';
import {
  Users, Target, ShoppingCart, TrendingUp, TrendingDown, Package, CheckCircle2,
  Inbox, IndianRupee, AlertCircle, RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';
import PageHeader from '../components/layout/PageHeader.jsx';
// Styling comes from styles/admin.css (loaded by AdminLayout); colours switch with dark/light mode.

const SOURCES = {
  website_form: { label: 'Website Form', color: 'var(--ax-accent)' },
  justdial: { label: 'Justdial', color: 'var(--ax-gold)' },
  indiamart: { label: 'IndiaMart', color: '#5b8def' },
  zoho: { label: 'Zoho CRM', color: '#9b85f0' },
  csv_import: { label: 'CSV Import', color: 'var(--ax-muted)' },
  manual_entry: { label: 'Manual Entry', color: '#d9779f' },
};

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
const getCacheKey = (user) => `dashboard_report_${user?._id || user?.id || 'anon'}`;

const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const CHART_W = 500;
const CHART_H = 170;
const PAD = 30;

/* ---------- Shared panel header ---------- */
function PanelHeader({ id, title, subtitle, children }) {
  return (
    <div className="ax-divider mb-5 flex items-start justify-between gap-2 border-b pb-4">
      <div className="space-y-1">
        <h2 id={id} className="ax-title">{title}</h2>
        <p className="ax-sub">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

/* ---------- Trend value: arrow + percentage ---------- */
function Trend({ pct, boxed = false }) {
  const isZero = /^[+-]?0(\.0+)?%$/.test(pct);
  const isUp = pct.startsWith('+');
  const color = isZero ? 'var(--ax-muted)' : isUp ? 'var(--ax-up)' : 'var(--ax-down)';
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={`ax-mono flex shrink-0 items-center gap-1 text-xs font-medium ${boxed ? 'ax-chip !text-xs !normal-case' : ''}`}
      style={{ color }}
    >
      {!isZero && <Icon size={12} aria-hidden="true" />}
      {pct}
    </span>
  );
}

/* ---------- KPI card ---------- */
const KpiSkeleton = () => (
  <div aria-hidden="true" className="ax-panel min-h-[144px] p-5 motion-safe:animate-pulse">
    <div className="flex items-center justify-between">
      <div className="ax-skel h-2.5 w-24" />
      <div className="ax-skel h-8 w-8" />
    </div>
    <div className="ax-skel mt-6 h-7 w-20" />
  </div>
);

const KpiCard = memo(function KpiCard({ card }) {
  const Icon = card.icon;
  return (
    <div className="ax-panel ax-panel--hover group flex min-h-[144px] flex-col justify-between p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="ax-label">{card.label}</span>
          <span aria-hidden="true" className="ax-iconbtn ax-iconbtn--sm group-hover:text-[var(--ax-accent)]">
            <Icon size={15} />
          </span>
        </div>
        <p className="mt-4 text-[28px] font-semibold leading-none tracking-[-0.035em] tabular-nums">{card.value}</p>
      </div>
      <div className="ax-divider mt-5 flex items-center justify-between border-t pt-3">
        <span className="ax-muted text-xs">vs last month</span>
        <Trend pct={card.pct} />
      </div>
    </div>
  );
});

/* ---------- Leads trend line chart ---------- */
const LeadsTrendChart = memo(function LeadsTrendChart({ report }) {
  const { points, pathD, areaD, trend } = useMemo(() => {
    const fallback = [
      { month: 'Jan', count: 4 }, { month: 'Feb', count: 8 }, { month: 'Mar', count: 15 },
      { month: 'Apr', count: 12 }, { month: 'May', count: 22 }, { month: 'Jun', count: report?.leads || 35 },
    ];
    const trendData = report?.leadsTrend?.length > 0
      ? report.leadsTrend.map((t) => ({ month: monthFormatter.format(new Date(2026, t._id.month - 1)), count: t.total }))
      : fallback;

    const max = Math.max(...trendData.map((d) => d.count), 10);
    const steps = Math.max(trendData.length - 1, 1);
    const pts = trendData.map((d, i) => ({
      x: PAD + (i * (CHART_W - PAD * 2)) / steps,
      y: CHART_H - PAD - (d.count * (CHART_H - PAD * 2)) / max,
      label: d.month,
      value: d.count,
    }));
    const path = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
    const area = pts.length ? `${path} L ${pts[pts.length - 1].x} ${CHART_H - PAD} L ${pts[0].x} ${CHART_H - PAD} Z` : '';
    return { points: pts, pathD: path, areaD: area, trend: trendData };
  }, [report]);

  return (
    <section aria-labelledby="trend-title" className="ax-panel p-5 lg:col-span-2">
      <PanelHeader id="trend-title" title="Ingested leads trend" subtitle="Monthly inbound leads ingestion volume">
        <Trend pct="+24.8%" boxed />
      </PanelHeader>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-labelledby="trend-title trend-desc" className="h-auto w-full overflow-visible">
        <desc id="trend-desc">Line chart of monthly leads: {trend.map((d) => `${d.month} ${d.count}`).join(', ')}.</desc>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ax-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--ax-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = PAD + r * (CHART_H - PAD * 2);
          return <line key={r} x1={PAD} y1={y} x2={CHART_W - PAD} y2={y} stroke="var(--ax-line)" strokeWidth="1" />;
        })}
        <path d={areaD} fill="url(#areaGradient)" />
        <path d={pathD} fill="none" stroke="var(--ax-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.label} className="group">
            <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--ax-surface)" stroke="var(--ax-accent)" strokeWidth="2" />
            <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
              <rect x={p.x - 22} y={p.y - 32} width="44" height="20" rx="2" fill="var(--ax-surface-2)" stroke="var(--ax-line-2)" />
              <text x={p.x} y={p.y - 18} fill="var(--ax-text)" fontSize="11" fontWeight="600" textAnchor="middle">{p.value}</text>
            </g>
            <text x={p.x} y={CHART_H - 8} fill="var(--ax-muted)" fontSize="11" fontFamily="var(--ax-mono)" letterSpacing="0.06em" textAnchor="middle">
              {p.label.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
});

/* ---------- Lead sources donut ---------- */
const LeadSourcesChart = memo(function LeadSourcesChart({ report }) {
  const { segments, totalLeads } = useMemo(() => {
    const total = report?.leads || 0;
    let offset = 0;
    const data = (report?.leadSources || []).map((item) => {
      const source = item._id || 'manual_entry';
      const count = item.count || 0;
      const percent = total > 0 ? (count / total) * 100 : 0;
      const seg = { source, count, percent, offset, ...(SOURCES[source] || { label: source, color: 'var(--ax-muted)' }) };
      offset += percent;
      return seg;
    });
    return { segments: data, totalLeads: total };
  }, [report]);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <section aria-labelledby="sources-title" className="ax-panel p-5">
      <PanelHeader id="sources-title" title="Lead sources distribution" subtitle="Channels routing inbound pipeline" />

      {totalLeads === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Target size={26} className="ax-muted mb-3" aria-hidden="true" />
          <span className="ax-muted text-sm">Ingest leads to populate metrics</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
          <div className="relative h-28 w-28 shrink-0">
            {/* Decorative: the legend beside it carries the same data as text */}
            <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--ax-line)" strokeWidth="8" />
              {segments.map((s) => (
                <circle
                  key={s.source}
                  cx="50" cy="50" r={radius} fill="transparent" stroke={s.color} strokeWidth="8"
                  strokeDasharray={`${(s.percent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-((s.offset / 100) * circumference)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold tracking-[-0.03em] tabular-nums">{totalLeads}</span>
              <span className="ax-label">Leads</span>
            </div>
          </div>

          <ul className="max-h-36 w-full flex-1 space-y-2.5 overflow-y-auto pr-1">
            {segments.map((s) => (
              <li key={s.source} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="ax-text-2 truncate">{s.label}</span>
                </span>
                <span className="ax-mono shrink-0 text-xs tabular-nums">
                  {s.count} <span className="ax-muted">{s.percent.toFixed(0)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

/* ------------------------------------ Page ------------------------------------ */

export default function Dashboard({ title = 'Dashboard' }) {
  const { user } = useAuth();
  const cacheKey = getCacheKey(user);

  const [report, setReport] = useState(() => readCache(cacheKey));
  const [loading, setLoading] = useState(report === null); // cached data = no waiting state at all
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showCharts, setShowCharts] = useState(false);

  // Stale-while-revalidate: show cache instantly, refresh in background
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    api.get('/reports/dashboard', { signal: controller.signal })
      .then((res) => {
        setReport(res.data);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(res.data)); } catch { /* ignore */ }
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        console.error('Failed to load dashboard report', err);
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [cacheKey, reloadKey]);

  // Charts render when the browser is idle, keeping the first paint light
  useEffect(() => {
    if (loading) return undefined;
    const hasRIC = 'requestIdleCallback' in window;
    const h = hasRIC ? window.requestIdleCallback(() => setShowCharts(true), { timeout: 500 }) : setTimeout(() => setShowCharts(true), 150);
    return () => (hasRIC ? window.cancelIdleCallback(h) : clearTimeout(h));
  }, [loading]);

  const cards = useMemo(() => {
    const all = [
      { label: 'Total Users', value: report?.users || 0, icon: Users, pct: '+4%', module: 'users' },
      { label: 'Products', value: report?.products || 0, icon: Package, pct: '+0%', module: 'catalog' },
      { label: 'Leads Ingested', value: report?.leads || 0, icon: Target, pct: '+24%', module: 'leads' },
      { label: 'Total Orders', value: report?.orders || 0, icon: ShoppingCart, pct: '+18%', module: 'orders' },
      { label: 'Paid Invoices', value: report?.paidPayments || 0, icon: CheckCircle2, pct: '+8%', module: 'invoices' },
      { label: 'Client Enquiries', value: report?.enquiries || 0, icon: Inbox, pct: '-5%', module: 'enquiries' },
      { label: 'Total Revenue', value: `₹${(report?.revenue || 0).toLocaleString()}`, icon: IndianRupee, pct: '+12%', module: 'payments' },
    ];
    return all.filter((c) => !c.module || hasPermission(user, c.module, 'read'));
  }, [report, user]);

  return (
    <div className="space-y-6" aria-busy={loading}>
      <PageHeader
        label="Overview"
        title={title}
        description="Real-time indicators and statistical graphics for your sales performance."
        className=""
      />

      {error && !report && (
        <div role="alert" className="ax-alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>Could not load the dashboard.</span>
          <button
            type="button"
            onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}
            className="ax-btn ax-btn--ghost ml-auto !h-8 !text-xs"
          >
            <RotateCw size={12} aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading && !report
          ? Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />)
          : cards.map((card) => <KpiCard key={card.label} card={card} />)}
        {loading && !report && <span role="status" className="sr-only">Loading dashboard data</span>}
      </section>

      {showCharts && report && hasPermission(user, 'leads', 'read') && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          <LeadsTrendChart report={report} />
          <LeadSourcesChart report={report} />
        </div>
      )}
    </div>
  );
}
