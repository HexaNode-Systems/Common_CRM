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
  ArrowRightLeft
} from 'lucide-react';

const triggerSources = [
  { value: 'all', label: 'All Sources' },
  { value: 'website_form', label: 'Website Form' },
  { value: 'justdial', label: 'Justdial' },
  { value: 'indiamart', label: 'IndiaMart' },
  { value: 'zoho', label: 'Zoho CRM' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'manual_entry', label: 'Manual Entry' }
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

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads/distribution-rules');
      setRules(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch distribution rules', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespersons = async () => {
    try {
      const res = await api.get('/users?limit=100');
      // Salespersons can be any active user except super_admin
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
    if (!form.name) return;

    setError('');

    const payload = {
      name: form.name,
      isActive: form.isActive,
      triggerSource: form.triggerSource,
      distributionType: form.distributionType,
      salespersons: form.distributionType === 'round_robin' ? form.salespersons : [],
      singleAssignee: form.distributionType === 'single_assignee' ? form.singleAssignee || null : null
    };

    // Validation
    if (form.distributionType === 'round_robin' && payload.salespersons.length === 0) {
      setError('Please select at least one salesperson for Round Robin distribution.');
      return;
    }
    if (form.distributionType === 'single_assignee' && !payload.singleAssignee) {
      setError('Please select a salesperson for Single Assignee distribution.');
      return;
    }

    try {
      if (editingRule) {
        const res = await api.put(`/leads/distribution-rules/${editingRule._id}`, payload);
        setRules(rules.map(r => (r._id === editingRule._id ? res.data : r)));
      } else {
        const res = await api.post('/leads/distribution-rules', payload);
        setRules([res.data, ...rules]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lead distribution flow.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead distribution rule?')) return;
    try {
      await api.delete(`/leads/distribution-rules/${id}`);
      setRules(rules.filter(r => r._id !== id));
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const res = await api.put(`/leads/distribution-rules/${rule._id}`, {
        isActive: !rule.isActive
      });
      setRules(rules.map(r => (r._id === rule._id ? res.data : r)));
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

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Access Denied. Only supervisors can configure Lead Distribution Flows.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Distribution Flows</h1>
          <p className="text-sm text-slate-500">Configure round-robin or targeted lead assignments for your sales team.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-primary text-white">
          <Plus size={16} />
          Create Distribution Flow
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
          <GitFork className="mx-auto h-12 w-12 text-slate-300 mb-3 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-900">No Lead Distribution Rules</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Create automated rules to assign incoming leads from webhooks, website forms, IndiaMart, Justdial or Zoho CRM directly to your salespersons.
          </p>
          <Button onClick={handleOpenCreate} className="mt-4 bg-primary text-white">
            Create First Flow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <div
              key={rule._id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                rule.isActive ? 'border-emerald-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-900 text-base">{rule.name}</h3>
                  <button
                    onClick={() => handleToggleActive(rule)}
                    title={rule.isActive ? 'Deactivate flow' : 'Activate flow'}
                    className={`rounded-lg p-1.5 transition ${
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Power size={16} />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="flex items-center gap-1.5"><Layers size={14} /> Trigger Source:</span>
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-xs">
                      {triggerSources.find(s => s.value === rule.triggerSource)?.label || rule.triggerSource}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span className="flex items-center gap-1.5"><ArrowRightLeft size={14} /> Type:</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {rule.distributionType === 'round_robin' ? 'Round Robin (Sequential)' : 'Single Assignee'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                    <Users size={12} /> Assigned Team Members
                  </h4>
                  {rule.distributionType === 'single_assignee' ? (
                    <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-xl flex items-center gap-2 border border-slate-100">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {rule.singleAssignee?.name?.slice(0, 1) || '?'}
                      </div>
                      <span className="truncate">{rule.singleAssignee?.name || 'Unassigned'}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {rule.salespersons?.map((sp) => (
                        <span
                          key={sp._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/5 border border-primary/10 px-2 py-0.5 text-xs text-primary font-medium"
                        >
                          {sp.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleOpenEdit(rule)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  title="Edit Rule"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(rule._id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition"
                  title="Delete Rule"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
          <div className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingRule ? 'Edit Lead Distribution Flow' : 'Create Lead Distribution Flow'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Flow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Form Round Robin"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Source</label>
                  <select
                    value={form.triggerSource}
                    onChange={(e) => setForm({ ...form, triggerSource: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    {triggerSources.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Distribution Type</label>
                  <select
                    value={form.distributionType}
                    onChange={(e) => setForm({ ...form, distributionType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="round_robin">Round Robin (Sequential)</option>
                    <option value="single_assignee">Single Assignee (Targeted)</option>
                  </select>
                </div>
              </div>

              {form.distributionType === 'single_assignee' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Salesperson</label>
                  <select
                    value={form.singleAssignee}
                    onChange={(e) => setForm({ ...form, singleAssignee: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">-- Choose Salesperson --</option>
                    {salespersons.map(sp => (
                      <option key={sp._id} value={sp._id}>{sp.name} ({sp.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Team Members for Queue</label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                    {salespersons.map(sp => (
                      <label key={sp._id} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.salespersons.includes(sp._id)}
                          onChange={() => handleSalespersonCheckbox(sp._id)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>{sp.name} <span className="text-xs text-slate-400">({sp.email})</span></span>
                      </label>
                    ))}
                    {salespersons.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No salespersons/staff available.</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Activate this flow immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button onClick={() => setIsModalOpen(false)} className="bg-slate-100 text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-white">
                  Save Flow
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
