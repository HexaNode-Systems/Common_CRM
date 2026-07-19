import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Card from '../components/Card.jsx';
import {
  Users,
  Target,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  Package,
  CheckCircle2,
  Inbox,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';

const sourceLabelMap = {
  website_form: 'Website Form',
  justdial: 'Justdial',
  indiamart: 'IndiaMart',
  zoho: 'Zoho CRM',
  csv_import: 'CSV Import',
  manual_entry: 'Manual Entry'
};

const sourceColorMap = {
  website_form: '#3b82f6', // blue
  justdial: '#f97316',     // orange
  indiamart: '#0d9488',    // teal
  zoho: '#8b5cf6',         // purple
  csv_import: '#64748b',   // slate
  manual_entry: '#ec4899'  // pink
};

export default function Dashboard({ title = 'Dashboard' }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    api.get('/reports/dashboard')
      .then((res) => setReport(res.data))
      .catch((err) => console.error('Failed to load dashboard report', err))
      .finally(() => setLoading(false));
  }, []);

  // Compute stats for sources distribution
  const leadDistribution = report?.leadSources || [];
  const totalLeads = report?.leads || 0;

  // Process data for Donut Chart
  let accumulatedPercent = 0;
  const donutData = leadDistribution.map((item) => {
    const count = item.count || 0;
    const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
    const segment = {
      source: item._id || 'manual_entry',
      count,
      percent,
      offset: accumulatedPercent,
      color: sourceColorMap[item._id] || '#64748b'
    };
    accumulatedPercent += percent;
    return segment;
  });

  // Default trends if empty
  const defaultLeadsTrend = [
    { month: 'Jan', count: 4 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 15 },
    { month: 'Apr', count: 12 },
    { month: 'May', count: 22 },
    { month: 'Jun', count: report?.leads || 35 }
  ];

  const trendData = report?.leadsTrend?.length > 0
    ? report.leadsTrend.map((t) => ({
        month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2026, t._id.month - 1)),
        count: t.total
      }))
    : defaultLeadsTrend;

  // SVG Area Chart calculations
  const chartHeight = 150;
  const chartWidth = 500;
  const maxCount = Math.max(...trendData.map(d => d.count), 10);
  const padding = 30;

  const points = trendData.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (trendData.length - 1);
    const y = chartHeight - padding - (d.count * (chartHeight - padding * 2)) / maxCount;
    return { x, y, label: d.month, value: d.count };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  const summaryCards = [
    { label: 'Total Users', value: report?.users || 0, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100', pct: '+4%', module: 'users' },
    { label: 'Products', value: report?.products || 0, icon: Package, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', pct: '+0%', module: 'catalog' },
    { label: 'Leads Ingested', value: report?.leads || 0, icon: Target, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', pct: '+24%', module: 'leads' },
    { label: 'Total Orders', value: report?.orders || 0, icon: ShoppingCart, color: 'text-violet-600 bg-violet-50 border-violet-100', pct: '+18%', module: 'orders' },
    { label: 'Paid Invoices', value: report?.paidPayments || 0, icon: CheckCircle2, color: 'text-sky-600 bg-sky-50 border-sky-100', pct: '+8%', module: 'invoices' },
    { label: 'Client Enquiries', value: report?.enquiries || 0, icon: Inbox, color: 'text-pink-600 bg-pink-50 border-pink-100', pct: '-5%', module: 'enquiries' },
    { label: 'Total Revenue', value: `₹${(report?.revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-amber-600 bg-amber-50 border-amber-100', pct: '+12%', module: 'payments' }
  ];

  const filteredCards = summaryCards.filter(card => {
    if (!card.module) return true;
    return hasPermission(user, card.module, 'read');
  });

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Real-time indicators and statistical graphics for your sales performance.</p>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.pct.startsWith('+');
          const isZero = card.pct === '+0%';
          return (
            <Card key={card.label} className="p-5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-slate-200/80 hover:border-slate-300 rounded-2xl bg-white shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
                  <div className={`rounded-xl p-2.5 border ${card.color.split(' ')[1]} ${card.color.split(' ')[2]}`}>
                    <Icon size={18} className={card.color.split(' ')[0]} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">vs last month</span>
                <span className={`text-2xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border ${
                  isZero ? 'bg-slate-50 text-slate-500 border-slate-200' :
                  isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {!isZero && (isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                  {card.pct}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Graphical Section */}
      {hasPermission(user, 'leads', 'read') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Line / Area Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ingested Leads Trend</h3>
                  <p className="text-2xs text-slate-400">Monthly inbound leads ingestion volume</p>
                </div>
                <span className="text-2xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                  <ArrowUpRight size={12} />
                  +24.8%
                </span>
              </div>

              {/* SVG Area Chart */}
              <div className="relative w-full">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const y = padding + r * (chartHeight - padding * 2);
                    return (
                      <line
                        key={i}
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Glowing Area Fill */}
                  <path d={areaD} fill="url(#areaGradient)" />

                  {/* Curved/Straight Trend Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Hover dots & Labels */}
                  {points.map((p, i) => (
                    <g key={i} className="group">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="var(--color-primary)"
                        stroke="white"
                        strokeWidth="2.5"
                        className="transition duration-150 group-hover:r-6"
                      />
                      {/* Tooltip on hover */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                        <rect
                          x={p.x - 25}
                          y={p.y - 32}
                          width="50"
                          height="20"
                          rx="5"
                          fill="#0f172a"
                        />
                        <text
                          x={p.x}
                          y={p.y - 18}
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {p.value}
                        </text>
                      </g>

                      {/* X Axis Labels */}
                      <text
                        x={p.x}
                        y={chartHeight - 8}
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Lead Source Distribution Donut Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Lead Sources Distribution</h3>
                  <p className="text-2xs text-slate-400">Channels routing inbound pipeline</p>
                </div>
              </div>

              {totalLeads === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                  <Target size={36} className="text-slate-200 mb-2" />
                  <span className="text-xs italic">Ingest leads to populate metrics</span>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  {/* SVG Donut */}
                  <div className="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      {donutData.map((item, i) => {
                        const radius = 35;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((item.offset / 100) * circumference);

                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="14"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-300 hover:stroke-[16]"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-slate-800 tracking-tight">{totalLeads}</span>
                      <span className="text-4xs text-slate-400 uppercase tracking-widest font-semibold">Leads</span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="flex-1 space-y-2 max-h-36 overflow-y-auto pr-1">
                    {donutData.map((item) => (
                      <div key={item.source} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-medium text-slate-600 truncate">{sourceLabelMap[item.source] || item.source}</span>
                        </div>
                        <div className="text-slate-400 font-semibold text-2xs">
                          <span>{item.count}</span>
                          <span className="ml-1 text-slate-300">({item.percent.toFixed(0)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
