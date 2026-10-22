import { useEffect, useState } from 'react';
import { Check, 
  Building, 
  Users, 
  ShieldAlert, 
  DollarSign, 
  Plus, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  Globe, 
  Settings2, 
  CreditCard,
  X
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';

const GB = 1024 * 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;
const CYCLE_LABEL = { monthly: '/ month', yearly: '/ year', lifetime: 'one-time' };

function toInputDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMonths(from, months) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + Number(months));
  return d;
}

function formatGb(bytes) {
  const gb = (Number(bytes) || 0) / GB;
  return Number.isInteger(gb) ? String(gb) : gb.toFixed(1);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** 'expired' | 'soon' | 'ok' | 'none' for a company's plan expiry. */
function expiryState(tenant) {
  if (!tenant.planExpiresAt) return 'none';
  const left = new Date(tenant.planExpiresAt).getTime() - Date.now();
  if (left < 0) return 'expired';
  if (left < 7 * DAY_MS) return 'soon';
  return 'ok';
}

function ModalError({ message }) {
  if (!message) return null;
  return <div className="rounded-theme border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{message}</div>;
}

const PLAN_FEATURES = [
  ['reports', 'Analytics & Work Reports'],
  ['vault', 'Secure Credentials Vault'],
  ['whatsapp', 'WhatsApp Web Integration'],
  ['whiteLabel', 'White-Label & Custom Branding'],
];

function PlanEditModal({ plan, saving, error, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    price: 0,
    billingCycle: 'monthly',
    isActive: true,
    description: '',
    maxUsers: 0,
    maxStorageGb: 0,
    maxEmployees: 0,
    maxCustomers: 0,
    maxLeads: 0,
    maxProjects: 0,
    features: {
      reports: false,
      whatsapp: false,
      vault: false,
      storage: false,
      support: false,
      whiteLabel: false
    }
  });

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name || '',
        price: plan.price || 0,
        billingCycle: plan.billingCycle || 'monthly',
        isActive: plan.isActive !== false,
        description: plan.description || '',
        maxUsers: plan.limits?.maxUsers || 0,
        maxStorageGb: plan.limits?.maxStorage ? Number(formatGb(plan.limits.maxStorage)) : 1,
        maxEmployees: plan.limits?.maxEmployees || 0,
        maxCustomers: plan.limits?.maxCustomers || 0,
        maxLeads: plan.limits?.maxLeads || 0,
        maxProjects: plan.limits?.maxProjects || 0,
        features: {
          reports: !!plan.features?.reports,
          whatsapp: !!plan.features?.whatsapp,
          vault: !!plan.features?.vault,
          storage: !!plan.features?.storage,
          support: !!plan.features?.support,
          whiteLabel: !!plan.features?.whiteLabel
        }
      });
    }
  }, [plan]);

  function handleSubmit(e) {
    e.preventDefault();
    const maxStorage = Math.round(Number(form.maxStorageGb) * GB);
    onSave({
      name: form.name.trim(),
      price: Number(form.price),
      billingCycle: form.billingCycle,
      isActive: form.isActive,
      description: form.description.trim(),
      limits: {
        maxUsers: Number(form.maxUsers),
        maxStorage,
        maxEmployees: Number(form.maxEmployees),
        maxCustomers: Number(form.maxCustomers),
        maxLeads: Number(form.maxLeads),
        maxProjects: Number(form.maxProjects)
      },
      features: form.features
    });
  }

  function handleFeatureChange(key) {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key]
      }
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Adjust Plan Configuration</h2>
              <p className="text-xs text-slate-500">Edit billing price, user limits, storage capacities, and premium modules.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <ModalError message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Plan Name</label>
              <input 
                type="text" 
                required 
                maxLength={60}
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.name} 
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Price ($)</label>
              <input 
                type="number" 
                required 
                min="0"
                step="0.01"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.price} 
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Billed</label>
              <select
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 bg-white outline-none focus:border-blue-500"
                value={form.billingCycle}
                onChange={(e) => setForm((prev) => ({ ...prev, billingCycle: e.target.value }))}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">One-time (lifetime)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Offer this plan to new companies (companies already on it keep it either way)
          </label>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Plan Description</label>
            <input 
              type="text" 
              maxLength={300}
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              value={form.description} 
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} 
            />
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-100">Plan Quota Limits</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Users</label>
              <input 
                type="number" 
                required 
                min="1"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.maxUsers} 
                onChange={(e) => setForm((prev) => ({ ...prev, maxUsers: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Storage (GB)</label>
              <input 
                type="number" 
                required 
                min="0.5"
                step="0.5"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.maxStorageGb} 
                onChange={(e) => setForm((prev) => ({ ...prev, maxStorageGb: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Employees</label>
              <input 
                type="number" 
                required 
                min="1"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.maxEmployees} 
                onChange={(e) => setForm((prev) => ({ ...prev, maxEmployees: e.target.value }))} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Customers</label>
              <input 
                type="number" 
                required 
                min="1"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.maxCustomers} 
                onChange={(e) => setForm((prev) => ({ ...prev, maxCustomers: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Leads</label>
              <input 
                type="number" 
                required 
                min="1"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.maxLeads} 
                onChange={(e) => setForm((prev) => ({ ...prev, maxLeads: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Projects</label>
              <input 
                type="number" 
                required 
                min="1"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.maxProjects} 
                onChange={(e) => setForm((prev) => ({ ...prev, maxProjects: e.target.value }))} 
              />
            </div>
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-100">Premium SaaS Features</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.keys(form.features).map((key) => (
              <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-all ${form.features[key] ? 'border-primary bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  className="h-4 w-4 accent-primary" 
                  checked={form.features[key]} 
                  onChange={() => handleFeatureChange(key)} 
                />
                <div>
                  <span className="font-semibold text-slate-800 capitalize">{key}</span>
                  <p className="text-xs text-slate-400">Enable {key} module access on this plan</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Cancel
          </button>
          <Button type="submit" disabled={saving} className="px-5 py-2">
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SubscriptionEditModal({ tenant, plans, saving, error, onClose, onSave }) {
  // Renewals start from the current expiry if it is still ahead, so paid days are not lost.
  const currentExpiry = tenant.planExpiresAt ? new Date(tenant.planExpiresAt) : null;
  const renewFrom = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const [duration, setDuration] = useState(tenant.subscriptionDuration || 1);
  const [planId, setPlanId] = useState(String(tenant.plan?._id || tenant.plan || ''));
  const [expiryDate, setExpiryDate] = useState(() => toInputDate(currentExpiry && currentExpiry > new Date() ? currentExpiry : addMonths(new Date(), 1)));
  const choosablePlans = plans.filter((p) => p.isActive !== false || String(p._id) === planId);

  const handleDurationChange = (e) => {
    const months = Number(e.target.value);
    setDuration(months);
    setExpiryDate(toInputDate(addMonths(renewFrom, months)));
  };

  const handleDateChange = (e) => {
    setExpiryDate(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      subscriptionDuration: duration,
      planExpiresAt: expiryDate,
      ...(planId ? { planId } : {})
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Tenant Subscription</h2>
              <p className="text-xs text-slate-500 font-medium">Modify subscription duration and expiry for {tenant.name}.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <ModalError message={error} />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Plan</label>
            <select
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 bg-white outline-none focus:border-blue-500"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {choosablePlans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (${formatMoney(p.price)} {CYCLE_LABEL[p.billingCycle] || ''}){p.isActive === false ? ' – no longer offered' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Subscription Duration</label>
            <select
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 bg-white outline-none focus:border-blue-500"
              value={duration}
              onChange={handleDurationChange}
            >
              <option value={1}>1 Month</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Expiry Date</label>
            <input 
              type="date"
              required
              min={toInputDate(new Date())}
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500"
              value={expiryDate}
              onChange={handleDateChange}
            />
            <p className="mt-1 text-xs text-slate-500">
              {currentExpiry
                ? `Currently ${currentExpiry < new Date() ? 'expired on' : 'paid until'} ${currentExpiry.toLocaleDateString()}. Choosing a duration adds it ${currentExpiry > new Date() ? 'on top of that date' : 'from today'}.`
                : 'No expiry set yet. Choosing a duration counts from today.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-theme border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <Button type="submit" disabled={saving} className="px-6 py-2.5">
            {saving ? 'Updating...' : 'Save Subscription'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { impersonate } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState('companies');
  
  // Data state
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form state for creating a new tenant
  const [newCompany, setNewCompany] = useState({
    name: '',
    subdomain: '',
    email: '',
    password: '',
    planSlug: 'starter',
    durationMonths: 1
  });
  const [creating, setCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [modalError, setModalError] = useState('');

  async function handleSaveSubscription(subForm) {
    setSavingSubscription(true);
    setModalError('');
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/v1/super-admin/tenants/${editingSubscription._id}/subscription`, subForm);
      setTenants((current) => current.map((t) => (t._id === data._id ? { ...t, ...data } : t)));
      setSuccess(`Subscription for '${data.name}' updated successfully!`);
      setEditingSubscription(null);
      const analyticsRes = await api.get('/v1/super-admin/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update subscription.');
    } finally {
      setSavingSubscription(false);
    }
  }

  async function handleSavePlan(planForm) {
    setSavingPlan(true);
    setModalError('');
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put(`/v1/super-admin/plans/${editingPlan._id}`, planForm);
      setPlans((current) => current.map((p) => (p._id === data._id ? data : p)));
      setSuccess(`Plan '${data.name}' limits updated successfully!`);
      setEditingPlan(null);
      
      const analyticsRes = await api.get('/v1/super-admin/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update plan configurations.');
    } finally {
      setSavingPlan(false);
    }
  }

  // Load analytics, tenants, and plans
  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, tenantsRes, plansRes] = await Promise.all([
        api.get('/v1/super-admin/analytics'),
        api.get('/v1/super-admin/tenants', {
          params: {
            page,
            search: searchQuery || undefined,
            status: statusFilter || undefined
          }
        }),
        api.get('/v1/super-admin/plans')
      ]);

      setAnalytics(analyticsRes.data);
      setTenants(tenantsRes.data.items || []);
      setTotalPages(tenantsRes.data.pagination?.pages || 1);
      const planItems = plansRes.data.items || [];
      setPlans(planItems);
      // Default the "new company" plan to one that is actually offered.
      setNewCompany((prev) => (planItems.some((p) => p.slug === prev.planSlug && p.isActive !== false)
        ? prev
        : { ...prev, planSlug: planItems.find((p) => p.isActive !== false)?.slug || prev.planSlug }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load platform administration details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else loadData();
  };

  // Toggle company status (suspend / activate)
  async function toggleTenantStatus(tenant) {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const question = nextStatus === 'suspended'
      ? `Suspend ${tenant.name}? Everyone at this company is signed out immediately and cannot sign in until you activate it again.`
      : `Activate ${tenant.name}? Its users will be able to sign in again.`;
    if (!window.confirm(question)) return;
    setActionLoadingId(tenant._id);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/v1/super-admin/tenants/${tenant._id}/status`, { status: nextStatus });
      setTenants((current) => current.map((item) => (item._id === data._id ? data : item)));
      setSuccess(`Company ${tenant.name} is now ${nextStatus}.`);
      
      // Reload analytics to reflect active count
      const analyticsRes = await api.get('/v1/super-admin/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update company account status.');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Provision a new Tenant database & seed default roles/permissions/settings
  async function handleCreateCompany(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/v1/super-admin/tenants', {
        ...newCompany,
        name: newCompany.name.trim(),
        subdomain: newCompany.subdomain.trim().toLowerCase(),
        email: newCompany.email.trim().toLowerCase()
      });
      setSuccess(`SaaS Tenant ${newCompany.name} created and database provisioned successfully!`);
      setNewCompany({
        name: '',
        subdomain: '',
        email: '',
        password: '',
        planSlug: newCompany.planSlug,
        durationMonths: 1
      });
      setActiveTab('companies');
      setPage(1);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to provision company.');
    } finally {
      setCreating(false);
    }
  }

  // Client Impersonation ("Login as Client") without password
  async function handleImpersonate(tenant) {
    const reason = window.prompt(`Enter reason for logging in as ${tenant.name} Admin:`);
    if (!reason || !reason.trim()) return;

    setActionLoadingId(tenant._id);
    setError('');
    try {
      const { data } = await api.post(`/v1/super-admin/tenants/${tenant._id}/impersonate`, { reason: reason.trim() });
      
      // Perform token swap in auth context
      impersonate(data.token, data.user, data.impersonation?.id);
      
      // Redirect to tenant dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Client impersonation failed.');
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-slate-900 text-white rounded-2xl inline-flex shadow-lg">
              <Building className="h-8 w-8" />
            </span>
            SaaS Platform Administration Panel
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor SaaS metrics, register new companies, manage billing plans, and log in to client systems.
          </p>
        </div>
        <div>
          <Button 
            variant="outline"
            onClick={loadData} 
            className="inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh Metrics
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-theme bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-theme bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <Card className="p-5 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Companies</p>
            <h3 className="text-2xl font-bold text-slate-800">{analytics?.totalTenants ?? '—'}</h3>
          </div>
        </Card>

        {/* Active Tenants */}
        <Card className="p-5 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Active Tenants</p>
            <h3 className="text-2xl font-bold text-slate-850">
              {analytics?.activeTenants ?? '—'} <span className="text-xs text-slate-400 font-normal">/ {analytics?.totalTenants ?? '—'}</span>
            </h3>
          </div>
        </Card>

        {/* Total Users */}
        <Card className="p-5 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Active SaaS Users</p>
            <h3 className="text-2xl font-bold text-slate-800">{analytics?.totalUsers ?? '—'}</h3>
          </div>
        </Card>

        {/* SaaS Estimated Revenue */}
        <Card className="p-5 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Monthly Recurring Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {analytics ? `$${formatMoney(analytics.mrr ?? analytics.revenuePlaceholder)}` : '—'} <span className="text-xs text-slate-400 font-normal">/ month</span>
            </h3>
            <p className="text-[11px] text-slate-400" title="Active companies with an unexpired plan. Yearly plans count as price ÷ 12; lifetime plans are not recurring.">
              From active, unexpired plans{analytics?.expiredTenants ? ` · ${analytics.expiredTenants} expired` : ''}{analytics?.expiringSoon ? ` · ${analytics.expiringSoon} expiring in 7 days` : ''}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'companies' 
              ? 'border-primary text-primary bg-blue-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Manage Companies
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'create' 
              ? 'border-primary text-primary bg-blue-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Provision New Tenant
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'plans' 
              ? 'border-primary text-primary bg-blue-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          SaaS Billing Plans
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {/* Filters card */}
          <Card className="p-4 bg-slate-50/50 border border-slate-100">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full rounded-theme border border-slate-200 pl-10 pr-4 py-2 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                  placeholder="Search by company name, subdomain, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-full md:w-52">
                <select
                  className="w-full rounded-theme border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="rounded-theme bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-sm font-semibold transition"
              >
                Search
              </button>
            </form>
          </Card>

          {/* Companies list table */}
          <Card className="overflow-hidden border border-slate-150">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-700 font-semibold">
                    <th className="px-5 py-4">Company Details</th>
                    <th className="px-5 py-4">Code / ID</th>
                    <th className="px-5 py-4">Subdomain / Domain</th>
                    <th className="px-5 py-4">Active Plan</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6">
                        <Loader label="Loading companies" />
                      </td>
                    </tr>
                  ) : tenants.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                        No registered SaaS companies found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    tenants.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{t.name}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Registered: {new Date(t.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {t.companyCode}
                          </span>
                          <span className="block text-xs text-slate-400 mt-1">{t.tenantId}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800 text-xs flex items-center gap-1">
                            <Globe size={13} className="text-slate-400" />
                            {t.subdomain}.ourcrm.com
                          </p>
                          {t.customDomain && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <ExternalLink size={11} /> {t.customDomain}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{t.plan?.name || '—'}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                              Duration: {t.subscriptionDuration || 1} {(t.subscriptionDuration || 1) === 1 ? 'Month' : 'Months'}
                            </p>
                            <p className={`text-xs mt-0.5 ${expiryState(t) === 'expired' ? 'font-semibold text-rose-600' : expiryState(t) === 'soon' ? 'font-semibold text-amber-600' : 'text-slate-400'}`}>
                              {expiryState(t) === 'expired' ? 'Expired' : 'Expires'}: {t.planExpiresAt ? new Date(t.planExpiresAt).toLocaleDateString() : 'No expiry'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                            t.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {t.status}
                          </span>
                          {t.status === 'active' && expiryState(t) === 'expired' ? (
                            <span className="ml-1 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700" title="The plan has expired. The company can still sign in until you suspend it.">
                              plan expired
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setModalError(''); setEditingSubscription(t); }}
                              disabled={actionLoadingId === t._id}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
                              title="Manage Subscription"
                            >
                              <CreditCard size={12} /> Subscription
                            </button>
                            <button
                              type="button"
                              onClick={() => handleImpersonate(t)}
                              disabled={actionLoadingId === t._id || t.status !== 'active'}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                              title={t.status === 'active' ? 'Login as Tenant' : 'Activate the company first'}
                            >
                              <Lock size={12} /> Login as Company
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleTenantStatus(t)}
                              disabled={actionLoadingId === t._id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                t.status === 'active' 
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {t.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <div className="inline-flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'create' && (
        <Card className="max-w-2xl mx-auto p-6 border border-slate-150">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Provision SaaS Tenant Database</h2>
              <p className="text-xs text-slate-500">Automatically creates database, seeds permissions & creates tenant admin.</p>
            </div>
          </div>

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                placeholder="e.g. Acme Corporation"
                value={newCompany.name}
                onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Desired Subdomain</label>
              <div className="flex rounded-theme border border-slate-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
                <input
                  type="text"
                  required
                  className="flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm outline-none"
                  placeholder="e.g. acme"
                  pattern="[A-Za-z0-9-]+"
                  title="Letters, digits and hyphens only"
                  maxLength={40}
                  value={newCompany.subdomain}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, subdomain: e.target.value }))}
                />
                <span className="bg-slate-100 text-slate-500 px-3.5 py-2.5 text-sm border-l border-slate-200 font-semibold select-none flex items-center">
                  .ourcrm.com
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Email ID</label>
                <input
                  type="email"
                  required
                  className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="e.g. admin@acme.com"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={newCompany.password}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none bg-white focus:border-blue-500"
                  value={newCompany.planSlug}
                  required
                  onChange={(e) => setNewCompany(prev => ({ ...prev, planSlug: e.target.value }))}
                >
                  {plans.filter((p) => p.isActive !== false).length === 0 ? <option value="">No plans available</option> : null}
                  {plans.filter((p) => p.isActive !== false).map((p) => (
                    <option key={p._id} value={p.slug}>{p.name} (${formatMoney(p.price)} {CYCLE_LABEL[p.billingCycle] || ''})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subscription Duration</label>
                <select
                  className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none bg-white focus:border-blue-500"
                  value={newCompany.durationMonths}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, durationMonths: Number(e.target.value) }))}
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
            </div>

            {/* Provisioning Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 space-y-2 mt-4">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-2">Provisioning Summary</p>
              <div className="flex justify-between">
                <span>Selected Plan:</span>
                <span className="font-semibold text-slate-900">{plans.find((p) => p.slug === newCompany.planSlug)?.name || newCompany.planSlug} Plan</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Duration:</span>
                <span className="font-semibold text-slate-900">{newCompany.durationMonths} {newCompany.durationMonths === 1 ? 'Month' : 'Months'}</span>
              </div>
              <div className="flex justify-between">
                <span>Calculated Expiry:</span>
                <span className="font-semibold text-slate-900">
                  {(() => {
                    const expiry = new Date();
                    expiry.setMonth(expiry.getMonth() + newCompany.durationMonths);
                    return expiry.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                  })()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button type="submit" disabled={creating} className="px-6 py-2.5">
                {creating ? 'Provisioning Database...' : 'Provision Tenant Account'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Duration Selector */}
          <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl max-w-md mx-auto shadow-inner border border-slate-200">
            {[
              { label: '1 Month', value: 1 },
              { label: '3 Months', value: 3 },
              { label: '6 Months', value: 6 },
              { label: '12 Months', value: 12 }
            ].map((dur) => (
              <button
                key={dur.value}
                type="button"
                onClick={() => setSelectedDuration(dur.value)}
                className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  selectedDuration === dur.value
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900 bg-transparent border-transparent'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              // Yearly prices are spread per month for this view; lifetime is a one-off.
              const monthly = plan.billingCycle === 'yearly' ? plan.price / 12 : plan.price;
              const displayPrice = plan.billingCycle === 'lifetime' ? plan.price : Math.round(monthly * selectedDuration * 100) / 100;
              return (
                <Card key={plan._id} className="p-6 bg-white border border-slate-150 relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-900">
                        {plan.name}
                        {plan.isActive === false ? <span className="ml-2 align-middle text-[11px] font-semibold text-slate-400">(not offered)</span> : null}
                      </h3>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase border border-blue-200">
                        {selectedDuration === 1 ? 'Monthly' : `${selectedDuration} Months`}
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 mb-2">
                      ${formatMoney(displayPrice)}
                      <span className="text-xs text-slate-400 font-normal">
                        {plan.billingCycle === 'lifetime' ? ' one-time' : selectedDuration === 1 ? ' / month' : ` total for ${selectedDuration} mos`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">{plan.description}</p>
                    
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Limits & Quotas:</h4>
                    <ul className="space-y-2 text-sm text-slate-600 mb-6">
                      <li className="flex items-center justify-between">
                        <span>Max Users:</span>
                        <span className="font-bold text-slate-800">{plan.limits?.maxUsers} Users</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Storage limit:</span>
                        <span className="font-bold text-slate-800">{formatGb(plan.limits?.maxStorage)} GB</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Max Leads:</span>
                        <span className="font-bold text-slate-800">{plan.limits?.maxLeads} Leads</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Max Projects:</span>
                        <span className="font-bold text-slate-800">{plan.limits?.maxProjects} Projects</span>
                      </li>
                    </ul>

                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 font-semibold">Enabled Features:</h4>
                    <ul className="space-y-2 text-xs text-slate-500 mb-6">
                      {PLAN_FEATURES.map(([key, label]) => (
                        <li key={key} className="flex items-center gap-2">
                          <Check size={13} aria-hidden="true" className={plan.features?.[key] ? 'text-emerald-500' : 'text-slate-300'} />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button 
                      onClick={() => { setModalError(''); setEditingPlan(plan); }}
                      variant="outline" 
                      className="w-full inline-flex items-center justify-center gap-2"
                    >
                      <Settings2 size={14} /> Adjust Plan Config
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {editingPlan && (
        <PlanEditModal 
          plan={editingPlan} 
          saving={savingPlan} 
          error={modalError}
          onClose={() => setEditingPlan(null)} 
          onSave={handleSavePlan} 
        />
      )}
      {editingSubscription && (
        <SubscriptionEditModal 
          tenant={editingSubscription}
          plans={plans}
          saving={savingSubscription}
          error={modalError}
          onClose={() => setEditingSubscription(null)}
          onSave={handleSaveSubscription}
        />
      )}
    </div>
  );
}
