import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import {
  GitFork,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Users,
  User,
  Power,
  Layers,
  ArrowRightLeft,
  Globe,
  Phone,
  ShoppingBag,
  Database,
  FileSpreadsheet,
  UserPlus,
  Zap,
  ChevronDown,
  Check,
  AlertCircle,
  Info,
  ShieldAlert,
  Sliders,
  CheckCircle,
  X
} from 'lucide-react';

const triggerSources = [
  { value: 'all', label: 'All Sources', icon: Zap, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { value: 'website_form', label: 'Website Form', icon: Globe, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 'justdial', label: 'Justdial', icon: Phone, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { value: 'indiamart', label: 'IndiaMart', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { value: 'zoho', label: 'Zoho CRM', icon: Database, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { value: 'csv_import', label: 'CSV Import', icon: FileSpreadsheet, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { value: 'manual_entry', label: 'Manual Entry', icon: UserPlus, color: 'text-sky-600 bg-sky-50 border-sky-100' }
];

export default function LeadDistributionPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    isActive: true,
    triggerSource: 'all',
    distributionType: 'round_robin',
    salespersons: [],
    singleAssignee: ''
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads/distribution-rules');
      setRules(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch distribution rules', err);
      setError('Unable to load distribution rules.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespersons = async () => {
    try {
      const res = await api.get('/users?limit=100');
      const sales = (res.data.items || []).filter(u => u.isActive && u.role !== 'super_admin');
      setSalespersons(sales);
    } catch (err) {
      console.error('Failed to fetch salespersons list', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchRules();
      fetchSalespersons();
    }
  }, [user]);

  const handleOpenCreate = () => {
    setError('');
    setSuccessMsg('');
    setEditingRule(null);
    setForm({
      name: '',
      isActive: true,
      triggerSource: 'all',
      distributionType: 'round_robin',
      salespersons: [],
      singleAssignee: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setError('');
    setSuccessMsg('');
    setEditingRule(rule);
    setForm({
      name: rule.name,
      isActive: rule.isActive,
      triggerSource: rule.triggerSource,
      distributionType: rule.distributionType,
      salespersons: rule.salespersons?.map(s => s._id) || [],
      singleAssignee: rule.singleAssignee?._id || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please provide a name for this distribution flow.');
      return;
    }

    setError('');
    setSuccessMsg('');

    const payload = {
      name: form.name.trim(),
      isActive: form.isActive,
      triggerSource: form.triggerSource,
      distributionType: form.distributionType,
      salespersons: form.distributionType === 'round_robin' ? form.salespersons : [],
      singleAssignee: form.distributionType === 'single_assignee' ? form.singleAssignee || null : null
    };

    // Validation
    if (form.distributionType === 'round_robin' && payload.salespersons.length === 0) {
      setError('Please select at least one salesperson for the Round Robin queue.');
      return;
    }
    if (form.distributionType === 'single_assignee' && !payload.singleAssignee) {
      setError('Please choose a salesperson to assign all leads from this source.');
      return;
    }

    try {
      if (editingRule) {
        const res = await api.put(`/leads/distribution-rules/${editingRule._id}`, payload);
        setRules(rules.map(r => (r._id === editingRule._id ? res.data : r)));
        showSuccess('Flow updated successfully.');
      } else {
        const res = await api.post('/leads/distribution-rules', payload);
        setRules([res.data, ...rules]);
        showSuccess('Flow created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lead distribution flow.');
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead distribution rule?')) return;
    try {
      await api.delete(`/leads/distribution-rules/${id}`);
      setRules(rules.filter(r => r._id !== id));
      showSuccess('Flow deleted successfully.');
    } catch (err) {
      console.error('Failed to delete rule', err);
      setError('Failed to delete rule.');
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const res = await api.put(`/leads/distribution-rules/${rule._id}`, {
        isActive: !rule.isActive
      });
      setRules(rules.map(r => (r._id === rule._id ? res.data : r)));
      showSuccess(`Flow is now ${!rule.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleSalespersonCheckbox = (id) => {
    setForm(prev => {
      const alreadySelected = prev.salespersons.includes(id);
      const nextList = alreadySelected
        ? prev.salespersons.filter(sid => sid !== id)
        : [...prev.salespersons, id];
      return { ...prev, salespersons: nextList };
    });
  };

  // Helper to render source badge with icon
  function renderSourceBadge(sourceValue) {
    const config = triggerSources.find(s => s.value === sourceValue) || {
      label: sourceValue,
      icon: Layers,
      color: 'text-slate-600 bg-slate-50 border-slate-100'
    };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  }

  // Check if multiple active rules target the same source (except 'all')
  const overlappingSources = rules
    .filter(r => r.isActive)
    .map(r => r.triggerSource)
    .reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

  if (user?.role !== 'super_admin') {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100 shadow-sm">
          <ShieldAlert size={22} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-500">
          Only administrators with supervisor access are permitted to configure automatic Lead Distribution rules.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Lead Distribution</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automate lead allocation to sales agents from incoming APIs, webhooks, form submissions, and files.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchRules}
            variant="outline"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            title="Refresh Flows List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
          >
            <Plus size={15} />
            New Flow
          </Button>
        </div>
      </div>

      {/* Success Notification Bar */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm transition">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid Rules / Loading / Empty state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-slate-150 bg-white p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-6 w-12 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2 py-2">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-4/5 bg-slate-100 rounded" />
              </div>
              <div className="h-8 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white max-w-2xl mx-auto px-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <GitFork size={22} className="animate-pulse text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Lead Assignment Rules Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Configure automated triggers that automatically distribute leads from external sources directly to your designated sales agents.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleOpenCreate}
              className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold px-4 py-2"
            >
              Configure First Rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => {
            const hasOverlappingActiveRules = rule.isActive && rule.triggerSource !== 'all' && overlappingSources[rule.triggerSource] > 1;
            return (
              <div
                key={rule._id}
                className={`group relative rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                  rule.isActive 
                    ? 'border-slate-200 hover:border-slate-300' 
                    : 'border-slate-150 bg-slate-50/40 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{rule.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">Flow ID: {rule._id.slice(-6).toUpperCase()}</span>
                    </div>
                    
                    {/* Shadcn Switch-like toggle */}
                    <button
                      onClick={() => handleToggleActive(rule)}
                      type="button"
                      role="switch"
                      aria-checked={rule.isActive}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                        rule.isActive ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
                          rule.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Overlap Source warning badge */}
                  {hasOverlappingActiveRules && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
                      <AlertCircle size={12} className="text-amber-600 flex-shrink-0" />
                      <span>Multiple active flows for this source!</span>
                    </div>
                  )}

                  {/* Core parameters list */}
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Trigger Triggered</span>
                      {renderSourceBadge(rule.triggerSource)}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Assignment Type</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Sliders size={11} className="text-slate-400" />
                        {rule.distributionType === 'round_robin' ? 'Round Robin Queue' : 'Single Owner'}
                      </span>
                    </div>
                  </div>

                  {/* Team assigned */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <Users size={12} /> Target Allocations
                    </h4>
                    {rule.distributionType === 'single_assignee' ? (
                      <div className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-100 p-2 rounded-lg flex items-center gap-2 max-w-full">
                        <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {rule.singleAssignee?.name?.slice(0, 1) || '?'}
                        </div>
                        <span className="truncate">{rule.singleAssignee?.name || 'Unassigned / Not Found'}</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {rule.salespersons && rule.salespersons.length > 0 ? (
                          rule.salespersons.map((sp) => (
                            <span
                              key={sp._id}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200/40 px-2 py-0.5 text-xs text-slate-700 font-semibold"
                            >
                              {sp.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <AlertCircle size={11} /> No agents configured in queue!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Footer */}
                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 opacity-90 group-hover:opacity-100">
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    title="Modify Flow"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule._id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                    title="Remove Flow"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Dialog Modal (shadcn style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          {/* Backdrop Click */}
          <button 
            type="button" 
            className="absolute inset-0 cursor-default" 
            aria-label="Close dialog" 
            onClick={() => setIsModalOpen(false)} 
          />

          <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200/80 animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4.5 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingRule ? 'Edit Distribution Rule' : 'Create Distribution Rule'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Define trigger conditions and destination salespersons.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 rounded-lg p-1.5 transition hover:bg-slate-100"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Validation alert */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700 flex items-start gap-2 animate-pulse">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Unique Flow Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Rule / Flow Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IndiaMart Round Robin Queue"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none placeholder-slate-400 transition"
                />
              </div>

              {/* Selector configurations */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Trigger Source *</label>
                  <div className="relative">
                    <select
                      value={form.triggerSource}
                      onChange={(e) => setForm({ ...form, triggerSource: e.target.value })}
                      className="w-full appearance-none rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-slate-400 focus:outline-none transition bg-white"
                    >
                      {triggerSources.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Allocation Schema *</label>
                  <div className="relative">
                    <select
                      value={form.distributionType}
                      onChange={(e) => setForm({ ...form, distributionType: e.target.value })}
                      className="w-full appearance-none rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-slate-400 focus:outline-none transition bg-white"
                    >
                      <option value="round_robin">Round Robin (Sequential)</option>
                      <option value="single_assignee">Single Agent (Targeted)</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Target allocation lists */}
              <div className="pt-2 border-t border-slate-50">
                {form.distributionType === 'single_assignee' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Sales Agent *</label>
                    {salespersons.length > 0 ? (
                      <div className="relative">
                        <select
                          value={form.singleAssignee}
                          onChange={(e) => setForm({ ...form, singleAssignee: e.target.value })}
                          className="w-full appearance-none rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-slate-400 focus:outline-none transition bg-white"
                          required
                        >
                          <option value="">-- Choose Agent --</option>
                          {salespersons.map(sp => (
                            <option key={sp._id} value={sp._id}>{sp.name} ({sp.email})</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                        No active agents found. Please create/activate staff in Users Management first.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Assign Staff to Round Robin Queue *
                    </label>
                    
                    {salespersons.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
                        {salespersons.map(sp => {
                          const isChecked = form.salespersons.includes(sp._id);
                          return (
                            <label 
                              key={sp._id} 
                              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer rounded-md transition ${
                                isChecked ? 'bg-white shadow-sm border border-slate-100' : 'hover:bg-white border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSalespersonCheckbox(sp._id)}
                                className="rounded border-slate-350 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900"
                              />
                              <span className="truncate">{sp.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">({sp.email})</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                        No active agents found. Please create/activate staff in Users Management first.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle isActive switch */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4.5 w-4.5 accent-slate-900"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Activate this distribution flow immediately
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition focus:outline-none"
                >
                  Cancel
                </button>
                <Button 
                  type="submit" 
                  className="rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 py-2 shadow-sm focus:outline-none"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
