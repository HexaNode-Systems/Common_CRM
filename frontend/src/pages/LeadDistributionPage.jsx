import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import {
  GitFork,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Users,
  Layers,
  Globe,
  Phone,
  ShoppingBag,
  Database,
  FileSpreadsheet,
  UserPlus,
  Inbox,
  ChevronDown,
  AlertCircle,
  ShieldAlert,
  Sliders,
  CheckCircle,
  Copy,
  KeyRound,
  Webhook,
  X
} from 'lucide-react';
import Loader from '../components/Loader.jsx';

const triggerSources = [
  { value: 'all', label: 'All Sources', icon: Inbox, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { value: 'website_form', label: 'Website Form', icon: Globe, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 'justdial', label: 'Justdial', icon: Phone, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { value: 'indiamart', label: 'IndiaMart', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { value: 'zoho', label: 'Zoho CRM', icon: Database, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { value: 'csv_import', label: 'CSV Import', icon: FileSpreadsheet, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { value: 'manual_entry', label: 'Manual Entry', icon: UserPlus, color: 'text-sky-600 bg-sky-50 border-sky-100' }
];

const emptyForm = {
  name: '',
  isActive: true,
  triggerSource: 'all',
  distributionType: 'round_robin',
  salespersons: [],
  singleAssignee: ''
};

// Shows the source name with its icon
function SourceBadge({ sourceValue }) {
  const config = triggerSources.find((s) => s.value === sourceValue) || {
    label: sourceValue,
    icon: Layers,
    color: 'text-slate-600 bg-slate-50 border-slate-100'
  };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export default function LeadDistributionPage() {
  const { user } = useAuth();
  // Managing routing needs Full access on Leads (or super admin), same as the server.
  const isSuperAdmin = user?.role === 'super_admin' || Boolean(user?.permissions?.includes('leads:delete'));

  const [rules, setRules] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salespersonsLoading, setSalespersonsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState('');         // errors inside the form dialog
  const [pageError, setPageError] = useState(''); // errors for the whole page (load, delete, toggle)
  const [successMsg, setSuccessMsg] = useState('');

  const [webhook, setWebhook] = useState(null);
  const [webhookError, setWebhookError] = useState('');
  const [copied, setCopied] = useState('');
  const [removedNotice, setRemovedNotice] = useState('');

  const salespersonsLoaded = useRef(false);
  const successTimer = useRef(null);

  // Load the rules list. This is the only thing needed to show the page.
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await api.get('/leads/distribution-rules');
      setRules(res.data.items || []);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Unable to load distribution rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  // The salespersons list is only needed inside the form,
  // so we load it the first time the form opens (not on page load).
  const loadSalespersons = useCallback(async () => {
    if (salespersonsLoaded.current) return;
    salespersonsLoaded.current = true;
    setSalespersonsLoading(true);
    try {
      // Active staff who can own leads (no customers, no inactive users).
      const res = await api.get('/leads/assignees');
      setSalespersons(res.data.items || []);
    } catch {
      salespersonsLoaded.current = false; // allow a retry next time
      setError('Unable to load the salespersons list.');
    } finally {
      setSalespersonsLoading(false);
    }
  }, []);

  // Depends on a simple true/false value, so it does not reload when the user object is only re-created
  const fetchWebhook = useCallback(async () => {
    setWebhookError('');
    try {
      const res = await api.get('/leads/webhook-info');
      setWebhook(res.data);
    } catch (err) {
      setWebhookError(err.response?.data?.message || 'Unable to load webhook URLs.');
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRules();
      fetchWebhook();
    }
  }, [isSuperAdmin, fetchRules, fetchWebhook]);

  const apiBase = String(api.defaults.baseURL || '').replace(/\/+$/, '').replace(/\/v1$/, '');
  const webhookUrl = (path) => `${apiBase.startsWith('http') ? apiBase : `${window.location.origin}${apiBase}`}${path}`;

  async function copyUrl(value) {
    try {
      await navigator.clipboard.writeText(webhookUrl(value));
      setCopied(value);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setWebhookError('Copy failed. Select the URL and copy it manually.');
    }
  }

  async function rotateKey() {
    if (!window.confirm('Create a new secret key? Every current webhook URL stops working until you paste the new URLs into IndiaMart, Justdial, Zoho and your website.')) return;
    setWebhookError('');
    try {
      const res = await api.post('/leads/webhook-info/rotate');
      setWebhook(res.data);
      showSuccess('New webhook key created. Update the URLs in every lead source.');
    } catch (err) {
      setWebhookError(err.response?.data?.message || 'Unable to create a new key.');
    }
  }

  // Clear the success message timer when leaving the page
  useEffect(() => () => clearTimeout(successTimer.current), []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreate = () => {
    setRemovedNotice('');
    setError('');
    setSuccessMsg('');
    setEditingRule(null);
    setForm(emptyForm);
    setIsModalOpen(true);
    loadSalespersons();
  };

  const handleOpenEdit = (rule) => {
    setError('');
    setSuccessMsg('');
    setEditingRule(rule);
    // Inactive / removed people can't receive leads, so they are taken out of the form up front.
    const inactive = new Set((rule.inactiveMembers || []).map((m) => String(m._id)));
    setRemovedNotice(rule.inactiveMembers?.length ? `${rule.inactiveMembers.map((m) => m.name).join(', ')} can no longer receive leads and will be removed when you save.` : '');
    setForm({
      name: rule.name,
      isActive: rule.isActive,
      triggerSource: rule.triggerSource,
      distributionType: rule.distributionType,
      salespersons: (rule.salespersons || []).map((s) => String(s._id)).filter((id) => !inactive.has(id)),
      singleAssignee: rule.singleAssignee && !inactive.has(String(rule.singleAssignee._id)) ? String(rule.singleAssignee._id) : ''
    });
    setIsModalOpen(true);
    loadSalespersons();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please provide a name for this distribution flow.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      isActive: form.isActive,
      triggerSource: form.triggerSource,
      distributionType: form.distributionType,
      salespersons: form.distributionType === 'round_robin' ? form.salespersons : [],
      singleAssignee: form.distributionType === 'single_assignee' ? form.singleAssignee || null : null
    };

    if (form.distributionType === 'round_robin' && payload.salespersons.length === 0) {
      setError('Please select at least one salesperson for the Round Robin queue.');
      return;
    }
    if (form.distributionType === 'single_assignee' && !payload.singleAssignee) {
      setError('Please choose a salesperson to assign all leads from this source.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      if (editingRule) {
        const res = await api.put(`/leads/distribution-rules/${editingRule._id}`, payload);
        setRules((current) => current.map((r) => (r._id === editingRule._id ? res.data : r)));
        showSuccess('Flow updated successfully.');
      } else {
        const res = await api.post('/leads/distribution-rules', payload);
        setRules((current) => [res.data, ...current]);
        showSuccess('Flow created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lead distribution flow.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead distribution rule?')) return;
    setPageError('');
    try {
      await api.delete(`/leads/distribution-rules/${id}`);
      setRules((current) => current.filter((r) => r._id !== id));
      showSuccess('Flow deleted successfully.');
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to delete rule.');
    }
  };

  const handleToggleActive = async (rule) => {
    setTogglingId(rule._id);
    setPageError('');
    try {
      const res = await api.put(`/leads/distribution-rules/${rule._id}`, { isActive: !rule.isActive });
      setRules((current) => current.map((r) => (r._id === rule._id ? res.data : r)));
      showSuccess(`Flow is now ${!rule.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to toggle status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSalespersonCheckbox = (id) => {
    setForm((prev) => {
      const alreadySelected = prev.salespersons.includes(id);
      const nextList = alreadySelected ? prev.salespersons.filter((sid) => sid !== id) : [...prev.salespersons, id];
      return { ...prev, salespersons: nextList };
    });
  };

  // How many active rules use each source (calculated only when rules change)
  const overlappingSources = useMemo(() => {
    const counts = {};
    rules.filter((r) => r.isActive).forEach((r) => {
      counts[r.triggerSource] = (counts[r.triggerSource] || 0) + 1;
    });
    return counts;
  }, [rules]);

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 shadow-sm">
          <ShieldAlert size={22} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-500">
          Lead routing needs Full access on Leads. Ask an administrator to change your role.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const agentsPlaceholder = salespersonsLoading ? (
    <Loader label="Loading agents" size="sm" />
  ) : (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
      No active staff who can own leads. Add or activate employees in Users first.
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        label="Routing"
        title="Lead Distribution"
        description="Automate lead allocation to sales agents from incoming APIs, webhooks, form submissions, and files."
        className=""
        actions={
          <>
            <Button variant="outline" onClick={fetchRules} className="gap-2" title="Refresh flows list">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Sync
            </Button>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus size={15} />
              New Flow
            </Button>
          </>
        }
      />

      {successMsg && (
        <div role="status" className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FIX: page errors were never shown before, so a failed load looked like "no rules" */}
      {pageError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{pageError}</p>
          </div>
          <button type="button" onClick={fetchRules} className="shrink-0 text-xs font-bold text-red-700 underline">Retry</button>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Webhook URLs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Webhook size={16} className="text-slate-500" /> Webhook URLs</h2>
            <p className="mt-1 text-xs text-slate-500">Paste these into each lead source. The secret key in the URL identifies your company; keep it private.</p>
          </div>
          {webhook?.canRotate ? (
            <button type="button" onClick={rotateKey} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
              <KeyRound size={13} /> New key
            </button>
          ) : null}
        </div>
        {webhookError ? <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{webhookError}</p> : null}
        {webhook?.message ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{webhook.message}</p> : null}
        {webhook?.token ? (
          <div className="mt-3 space-y-2">
            {webhook.sources.map((src) => (
              <div key={src.value} className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2 sm:flex-row sm:items-center">
                <span className="w-28 shrink-0 text-xs font-semibold text-slate-700">{src.label}</span>
                <code className="min-w-0 flex-1 truncate text-[11px] text-slate-600" title={webhookUrl(src.path)}>{webhookUrl(src.path)}</code>
                <button type="button" onClick={() => copyUrl(src.path)} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">
                  {copied === src.path ? <CheckCircle size={12} className="text-emerald-600" /> : <Copy size={12} />}{copied === src.path ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
            <p className="text-[11px] text-slate-500">Accepts JSON or form posts, one lead or a list (up to 100). A repeat enquiry from a known number is added to that lead's history instead of creating a duplicate.</p>
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading rules">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-6 w-12 rounded-full bg-slate-200" />
              </div>
              <div className="space-y-2 py-2">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
              </div>
              <div className="h-8 rounded bg-slate-50" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 && !pageError ? (
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center sm:py-20">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
            <GitFork size={22} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Lead Assignment Rules Found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Configure automated triggers that automatically distribute leads from external sources directly to your designated sales agents.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleOpenCreate} className="bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              Configure First Rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => {
            const hasOverlappingActiveRules = rule.isActive && rule.triggerSource !== 'all' && overlappingSources[rule.triggerSource] > 1;
            return (
              <div
                key={rule._id}
                className={`group relative flex flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
                  rule.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/40 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold leading-snug text-slate-900">{rule.name}</h3>
                      <span className="text-[10px] font-medium text-slate-400">Flow ID: {rule._id.slice(-6).toUpperCase()}</span>
                    </div>

                    {/* On/off switch */}
                    <button
                      onClick={() => handleToggleActive(rule)}
                      disabled={togglingId === rule._id}
                      type="button"
                      role="switch"
                      aria-checked={rule.isActive}
                      aria-label={`${rule.name} is ${rule.isActive ? 'active' : 'inactive'}. Toggle status`}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-50 ${
                        rule.isActive ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          rule.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {rule.inactiveMembers?.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                      <AlertCircle size={12} className="shrink-0 text-amber-600" />
                      <span>Skipped (inactive): {rule.inactiveMembers.map((m) => m.name).join(', ')}</span>
                    </div>
                  )}
                  {rule.isActive && !rule.nextAssignee && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>No active agent. Leads fall through to the All Sources flow (or stay unassigned).</span>
                    </div>
                  )}

                  {hasOverlappingActiveRules && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                      <AlertCircle size={12} className="shrink-0 text-amber-600" />
                      <span>Multiple active flows for this source!</span>
                    </div>
                  )}

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trigger Source</span>
                      <SourceBadge sourceValue={rule.triggerSource} />
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assignment Type</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Sliders size={11} className="text-slate-400" />
                        {rule.distributionType === 'round_robin' ? 'Round Robin Queue' : 'Single Owner'}
                      </span>
                    </div>

                    {rule.nextAssignee ? (
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Next Lead Goes To</span>
                        <span className="font-semibold text-slate-800">{rule.nextAssignee.name}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <Users size={12} /> Target Allocations
                    </h4>
                    {rule.distributionType === 'single_assignee' ? (
                      <div className="flex max-w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs font-semibold text-slate-800">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                          {rule.singleAssignee?.name?.slice(0, 1) || '?'}
                        </div>
                        <span className="truncate">{rule.singleAssignee?.name || 'Unassigned / Not Found'}</span>
                      </div>
                    ) : (
                      <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto pr-1">
                        {rule.salespersons && rule.salespersons.length > 0 ? (
                          rule.salespersons.map((sp) => (
                            <span key={sp._id} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${rule.inactiveMembers?.some((m) => String(m._id) === String(sp._id)) ? 'border-amber-200 bg-amber-50 text-amber-700 line-through' : 'border-slate-200/40 bg-slate-100 text-slate-700'}`}>
                              {sp.name}
                            </span>
                          ))
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                            <AlertCircle size={11} /> No agents configured in queue!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rule)}
                    aria-label={`Edit ${rule.name}`}
                    title="Modify Flow"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 sm:h-8 sm:w-8"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule._id)}
                    aria-label={`Delete ${rule.name}`}
                    title="Remove Flow"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50 sm:h-8 sm:w-8"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog: bottom sheet on phones, centered on larger screens */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog" onClick={() => setIsModalOpen(false)} />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="distribution-dialog-title"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-slate-200/80 bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id="distribution-dialog-title" className="text-lg font-bold text-slate-900">
                  {editingRule ? 'Edit Distribution Rule' : 'Create Distribution Rule'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Pick the source and who receives its leads. If this flow has no active agent, the All Sources flow is used.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {removedNotice && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                  <span>{removedNotice}</span>
                </div>
              )}
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="rule-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Rule / Flow Name *</label>
                <input
                  id="rule-name"
                  type="text"
                  required
                  placeholder="e.g. IndiaMart Round Robin Queue"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 transition focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="trigger-source" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Trigger Source *</label>
                  <div className="relative">
                    <select
                      id="trigger-source"
                      value={form.triggerSource}
                      onChange={(e) => setForm({ ...form, triggerSource: e.target.value })}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white p-2.5 pr-8 text-sm transition focus:border-slate-400 focus:outline-none"
                    >
                      {triggerSources.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="allocation-type" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Allocation Schema *</label>
                  <div className="relative">
                    <select
                      id="allocation-type"
                      value={form.distributionType}
                      onChange={(e) => setForm({ ...form, distributionType: e.target.value })}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white p-2.5 pr-8 text-sm transition focus:border-slate-400 focus:outline-none"
                    >
                      <option value="round_robin">Round Robin (Sequential)</option>
                      <option value="single_assignee">Single Agent (Targeted)</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                {form.distributionType === 'single_assignee' ? (
                  <div>
                    <label htmlFor="single-agent" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Select Sales Agent *</label>
                    {salespersons.length > 0 ? (
                      <div className="relative">
                        <select
                          id="single-agent"
                          value={form.singleAssignee}
                          onChange={(e) => setForm({ ...form, singleAssignee: e.target.value })}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white p-2.5 pr-8 text-sm transition focus:border-slate-400 focus:outline-none"
                          required
                        >
                          <option value="">-- Choose Agent --</option>
                          {salespersons.map((sp) => (
                            <option key={sp._id} value={sp._id}>{sp.name} ({sp.email})</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    ) : agentsPlaceholder}
                  </div>
                ) : (
                  <fieldset>
                    <legend className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Assign Staff to Round Robin Queue *
                    </legend>
                    {salespersons.length > 0 ? (
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                        {salespersons.map((sp) => {
                          const isChecked = form.salespersons.includes(sp._id);
                          return (
                            <label
                              key={sp._id}
                              className={`flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 transition ${
                                isChecked ? 'border border-slate-100 bg-white shadow-sm' : 'border border-transparent hover:bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSalespersonCheckbox(sp._id)}
                                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-900"
                              />
                              <span className="truncate">{sp.name}</span>
                              <span className="hidden truncate text-[10px] font-medium text-slate-400 sm:inline">({sp.email})</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : agentsPlaceholder}
                  </fieldset>
                )}
              </div>

              <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <label htmlFor="isActive" className="cursor-pointer select-none text-xs font-semibold text-slate-700">
                  Activate this distribution flow immediately
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 focus:outline-none"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}