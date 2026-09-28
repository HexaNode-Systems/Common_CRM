import { useEffect, useMemo, useState, memo } from 'react';
import { api } from '../api/client.js';
import Card from '../components/Card.jsx';
import {
  Users, Target, ShoppingCart, TrendingUp, ArrowUpRight, TrendingDown,
  Package, CheckCircle2, Inbox, IndianRupee, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';

const sourceLabelMap = {
  website_form: 'Website Form',
  justdial: 'Justdial',
  indiamart: 'IndiaMart',
  zoho: 'Zoho CRM',
  csv_import: 'CSV Import',
  manual_entry: 'Manual Entry',
};

const sourceColorMap = {
  website_form: '#3b82f6',
  justdial: '#f97316',
  indiamart: '#0d9488',
  zoho: '#8b5cf6',
  csv_import: '#64748b',
  manual_entry: '#ec4899',
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

/* ---------- Skeleton: page layout paints immediately while the API is still working ---------- */
const KpiSkeleton = () => (
  <div aria-hidden="true" className="min-h-[136px] rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 motion-safe:animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="h-10 w-10 rounded-xl bg-slate-100" />
    </div>
    <div className="mt-5 h-7 w-20 rounded bg-slate-100" />
  </div>
);

/* ---------- KPI card (memo: re-renders only if its own data changes) ---------- */
const KpiCard = memo(function KpiCard({ card }) {
  const Icon = card.icon;
  const [textCls, bgCls, borderCls] = card.color.split(' ');
  const isPositive = card.pct.startsWith('+');
  const isZero = card.pct === '+0%';
  return (
    <Card className="min-h-[136px] p-4 sm:p-5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-[transform,box-shadow] duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 border border-slate-200 hover:border-slate-300 rounded-2xl bg-white">
      <div>
        <div className="flex items-center justify-between gap-2">
          {/* was text-slate-400 (2.6:1) at 11px */}
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{card.label}</span>
          <div aria-hidden="true" className={`rounded-xl p-2.5 border ${bgCls} ${borderCls}`}>
            <Icon size={18} className={textCls} />
          </div>
        </div>
        <p className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-600 font-medium">vs last month</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border ${
          isZero ? 'bg-slate-50 text-slate-700 border-slate-300'
            : isPositive ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'}`}
        >
          {!isZero && (isPositive ? <TrendingUp size={10} aria-hidden="true" /> : <TrendingDown size={10} aria-hidden="true" />)}
          {card.pct}
        </span>
      </div>
    </Card>
  );
});

/* ---------- Charts as memoised components ---------- */
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
    const path = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const area = pts.length ? `${path} L ${pts[pts.length - 1].x} ${CHART_H - PAD} L ${pts[0].x} ${CHART_H - PAD} Z` : '';
    return { points: pts, pathD: path, areaD: area, trend: trendData };
  }, [report]);

  return (
    <section aria-labelledby="trend-title" className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          {/* H2 (was H3 directly under H1) */}
          <h2 id="trend-title" className="font-bold text-slate-900 text-sm">Ingested leads trend</h2>
          <p className="text-xs text-slate-600">Monthly inbound leads ingestion volume</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 shrink-0">
          <ArrowUpRight size={12} aria-hidden="true" /> +24.8%
        </span>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-labelledby="trend-title trend-desc" className="w-full h-auto overflow-visible">
        <desc id="trend-desc">Line chart of monthly leads: {trend.map((d) => `${d.month} ${d.count}`).join(', ')}.</desc>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = PAD + r * (CHART_H - PAD * 2);
          return <line key={r} x1={PAD} y1={y} x2={CHART_W - PAD} y2={y} stroke="#e2e8f0" strokeWidth="1.5" />;
        })}
        <path d={areaD} fill="url(#areaGradient)" />
        <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.label} className="group">
            <circle cx={p.x} cy={p.y} r="4.5" fill="var(--color-primary)" stroke="white" strokeWidth="2.5" />
            <g className="opacity-0 group-hover:opacity-100 pointer-events-none">
              <rect x={p.x - 24} y={p.y - 34} width="48" height="22" rx="5" fill="#0f172a" />
              <text x={p.x} y={p.y - 18} fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">{p.value}</text>
            </g>
            {/* was #94a3b8 (2.6:1) at 9px; now #475569 (7.5:1) at 12px so it stays readable when scaled down on phones */}
            <text x={p.x} y={CHART_H - 8} fill="#475569" fontSize="12" fontWeight="600" textAnchor="middle">{p.label}</text>
          </g>
        ))}
      </svg>
    </section>
  );
});

const LeadSourcesChart = memo(function LeadSourcesChart({ report }) {
  const { donutData, totalLeads } = useMemo(() => {
    const dist = report?.leadSources || [];
    const total = report?.leads || 0;
    let acc = 0;
    const data = dist.map((item) => {
      const count = item.count || 0;
      const percent = total > 0 ? (count / total) * 100 : 0;
      const seg = { source: item._id || 'manual_entry', count, percent, offset: acc, color: sourceColorMap[item._id] || '#64748b' };
      acc += percent;
      return seg;
    });
    return { donutData: data, totalLeads: total };
  }, [report]);

  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  return (
    <section aria-labelledby="sources-title" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h2 id="sources-title" className="font-bold text-slate-900 text-sm">Lead sources distribution</h2>
        <p className="text-xs text-slate-600">Channels routing inbound pipeline</p>
      </div>

      {totalLeads === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-600">
          <Target size={36} className="text-slate-400 mb-2" aria-hidden="true" />
          <span className="text-sm">Ingest leads to populate metrics</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative h-28 w-28 shrink-0">
            {/* Decorative: the legend beside it carries the same data as text */}
            <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
              {donutData.map((item) => (
                <circle
                  key={item.source}
                  cx="50" cy="50" r={radius} fill="transparent" stroke={item.color} strokeWidth="14"
                  strokeDasharray={`${(item.percent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-((item.offset / 100) * circumference)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-slate-900">{totalLeads}</span>
              <span className="text-xs text-slate-600 font-semibold">Leads</span>
            </div>
          </div>

          <ul className="w-full flex-1 space-y-2 max-h-36 overflow-y-auto pr-1">
            {donutData.map((item) => (
              <li key={item.source} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-800 truncate">{sourceLabelMap[item.source] || item.source}</span>
                </span>
                <span className="text-slate-700 font-semibold shrink-0">
                  {item.count} <span className="text-slate-600 font-normal">({item.percent.toFixed(0)}%)</span>
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
      { label: 'Total Users', value: report?.users || 0, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100', pct: '+4%', module: 'users' },
      { label: 'Products', value: report?.products || 0, icon: Package, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', pct: '+0%', module: 'catalog' },
      { label: 'Leads Ingested', value: report?.leads || 0, icon: Target, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', pct: '+24%', module: 'leads' },
      { label: 'Total Orders', value: report?.orders || 0, icon: ShoppingCart, color: 'text-violet-600 bg-violet-50 border-violet-100', pct: '+18%', module: 'orders' },
      { label: 'Paid Invoices', value: report?.paidPayments || 0, icon: CheckCircle2, color: 'text-sky-600 bg-sky-50 border-sky-100', pct: '+8%', module: 'invoices' },
      { label: 'Client Enquiries', value: report?.enquiries || 0, icon: Inbox, color: 'text-pink-600 bg-pink-50 border-pink-100', pct: '-5%', module: 'enquiries' },
      { label: 'Total Revenue', value: `₹${(report?.revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-amber-600 bg-amber-50 border-amber-100', pct: '+12%', module: 'payments' },
    ];
    return all.filter((c) => !c.module || hasPermission(user, c.module, 'read'));
  }, [report, user]);

  return (
    <div className="space-y-4 sm:space-y-6" aria-busy={loading}>
      {/* Header paints immediately (no full-screen spinner blocking the page) */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">Real-time indicators and statistical graphics for your sales performance.</p>
      </div>

      {error && !report && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          <AlertCircle size={16} aria-hidden="true" />
          <span>Could not load the dashboard.</span>
          <button type="button" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }} className="ml-auto rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100">
            Try again
          </button>
        </div>
      )}

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {loading && !report
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : cards.map((card) => <KpiCard key={card.label} card={card} />)}
        {loading && !report && <span role="status" className="sr-only">Loading dashboard data</span>}
      </section>

      {showCharts && report && hasPermission(user, 'leads', 'read') && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <LeadsTrendChart report={report} />
          <LeadSourcesChart report={report} />
        </div>
      )}
    </div>
  );
}