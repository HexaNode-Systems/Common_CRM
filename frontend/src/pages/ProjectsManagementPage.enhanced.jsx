import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, FileText, Plus, RefreshCw, Search, UploadCloud, X, AlertCircle, Clock, DollarSign, Users } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const PROJECT_STATUSES = ['Pipeline', 'Running', 'Finished', 'Blocked'];
const DOC_CATEGORIES = [
  { value: 'agreement', label: 'Agreement / Contract' },
  { value: 'prd', label: 'PRD (Product Requirement Document)' },
  { value: 'invoice', label: 'Invoice / Financial Record' },
  { value: 'other', label: 'Other Attachments' }
];

const emptyForm = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  title: '',
  description: '',
  startDate: '',
  deadline: '',
  budget: '',
  currency: 'INR',
  projectStatus: 'Pipeline',
  assignedUserIds: []
};

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatMoney(amount, currency = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function getStatusBadge(status) {
  const styles = {
    Running: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Finished: 'bg-slate-100 text-slate-600 border border-slate-200',
    Blocked: 'bg-red-50 text-red-700 border border-red-200',
    Pipeline: 'bg-blue-50 text-blue-700 border border-blue-200'
  };
  return styles[status] || styles.Pipeline;
}

function getStatusIcon(status) {
  if (status === 'Running') return <Clock size={14} className="inline mr-1" />;
  if (status === 'Finished') return <CheckCircle2 size={14} className="inline mr-1" />;
  if (status === 'Blocked') return <AlertCircle size={14} className="inline mr-1" />;
  return null;
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

function TeamStack({ team = [] }) {
  if (!team.length) return <span className="text-xs text-slate-500 italic">Unassigned</span>;
  const visible = team.slice(0, 3);
  const remaining = team.length - visible.length;
  
  return (
    <div className="flex items-center gap-1">
      {visible.map((member, index) => (
        <div
          key={member.user || member.email || index}
          title={`${member.name}${member.role ? ` - ${member.role}` : ''}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] font-bold text-white shadow-sm"
        >
          {initials(member.name)}
        </div>
      ))}
      {remaining > 0 ? (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-[10px] font-bold text-slate-700 shadow-sm" title={`+${remaining} more`}>
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}

function ProjectDrawer({ mode, project, users, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [capacityWarnings, setCapacityWarnings] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!project && mode !== 'create') {
      setForm(emptyForm);
      setFiles([]);
      setError('');
      setCapacityWarnings([]);
      return;
    }

    if (project) {
      setForm({
        clientName: project.client?.name || '',
        clientEmail: project.client?.email || '',
        clientPhone: project.client?.phone || '',
        title: project.title || '',
        description: project.description || '',
        startDate: toDateInput(project.startDate),
        deadline: toDateInput(project.deadline),
        budget: project.budget || project.price || '',
        currency: project.currency || 'INR',
        projectStatus: project.projectStatus || 'Pipeline',
        assignedUserIds: (project.assignedTeam || []).map((member) => String(member.user))
      });
    } else {
      setForm(emptyForm);
    }
    setFiles([]);
    setError('');
    setCapacityWarnings([]);
  }, [project, mode]);

  useEffect(() => {
    if (!form.assignedUserIds.length) {
      setCapacityWarnings([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get('/catalog/capacity', {
          params: { userIds: JSON.stringify(form.assignedUserIds) }
        });
        setCapacityWarnings(data.warnings || []);
      } catch {
        setCapacityWarnings([]);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.assignedUserIds]);

  if (!project && mode !== 'create') return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleUser(userId) {
    setForm((current) => ({
      ...current,
      assignedUserIds: current.assignedUserIds.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...current.assignedUserIds, userId]
    }));
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []).map((file) => ({ file, category: 'other' }));
    setFiles((current) => [...current, ...incoming]);
  }

  function updateFileCategory(index, category) {
    setFiles((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, category } : item
    )));
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (form.startDate && form.deadline && new Date(form.deadline) <= new Date(form.startDate)) {
      setError('Deadline must occur after the Project Start Date.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, budget: Number(form.budget || 0) };
      const { data: savedProject } = mode === 'create'
        ? await api.post('/catalog', payload)
        : await api.put(`/catalog/${project._id}`, payload);

      if (files.length) {
        const body = new FormData();
        files.forEach((item) => body.append('documents', item.file));
        body.append('categories', JSON.stringify(files.map((item) => item.category)));
        await api.post(`/catalog/${savedProject._id}/documents`, body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close project drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{mode === 'create' ? '+ New Project' : `Edit: ${project.title}`}</h2>
            <p className="mt-1 text-sm text-slate-600">Client details, timeline, team, budget & documents</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100" aria-label="Close" title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
          {error ? (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          {capacityWarnings.length ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
                <AlertCircle size={16} /> Resource Allocation Warning
              </p>
              <ul className="space-y-1">
                {capacityWarnings.map((warning) => (
                  <li key={warning.userId} className="text-sm text-amber-800">• {warning.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <section className="mb-7">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-slate-900">
              <Users size={16} /> Client Context & Contact
            </h3>
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Client Company Name</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    placeholder="Acme Corporation"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Contact Email</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => updateField('clientEmail', e.target.value)}
                    placeholder="contact@acme.com"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Phone / WhatsApp</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    inputMode="numeric"
                    value={form.clientPhone}
                    onChange={(e) => updateField('clientPhone', e.target.value.replace(/[^0-9+ -]/g, ''))}
                    placeholder="+91 98765 43210"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="mb-7">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-slate-900">
              <Clock size={16} /> Project Parameters & Timeline
            </h3>
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Project Name</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="E-commerce Platform Development"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Project Status</span>
                  <select
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.projectStatus}
                    onChange={(e) => updateField('projectStatus', e.target.value)}
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Description & Scope</span>
                  <textarea
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                    rows="3"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Define project scope, key deliverables, technical requirements..."
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Start Date</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Deadline / End Date</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    type="date"
                    value={form.deadline}
                    min={form.startDate || undefined}
                    onChange={(e) => updateField('deadline', e.target.value)}
                    required
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="mb-7">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-slate-900">
              <DollarSign size={16} /> Financials
            </h3>
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Budget Amount</span>
                  <input
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    type="number"
                    min="0"
                    step="1"
                    value={form.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    placeholder="50000"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Currency</span>
                  <select
                    className="input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                  >
                    <option value="INR">Indian Rupees (₹)</option>
                    <option value="USD">US Dollars ($)</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="mb-7">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-slate-900">
              <Users size={16} /> Team Assignment
            </h3>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white">
              {users.length ? (
                <div className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <label
                      key={user._id}
                      className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition hover:bg-blue-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role} • {user.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                        checked={form.assignedUserIds.includes(String(user._id))}
                        onChange={() => toggleUser(String(user._id))}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-slate-500">No active users found</p>
              )}
            </div>
          </section>

          <section className="mb-7">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-slate-900">
              <FileText size={16} /> Project Documents
            </h3>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed px-6 py-12 text-center transition ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <label className="block cursor-pointer">
                <UploadCloud className={`mx-auto mb-3 ${dragActive ? 'text-blue-600' : 'text-slate-400'}`} size={32} />
                <span className="block text-sm font-medium text-slate-900">Drop files or click to browse</span>
                <span className="mt-1 block text-xs text-slate-600">Agreements, PRDs, invoices, attachments</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                  accept="*/*"
                />
              </label>
            </div>

            {files.length ? (
              <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                {files.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{item.file.name}</p>
                      <p className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="input rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs sm:w-40"
                        value={item.category}
                        onChange={(e) => updateFileCategory(index, e.target.value)}
                      >
                        {DOC_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button disabled={saving} type="submit" className="rounded-lg px-5 py-2">
              {saving ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Update Project'}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerState, setDrawerState] = useState({ mode: null, project: null });
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '', search: '' });

  async function loadProjects(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/catalog', { params: { ...nextFilters, limit: 100 } });
      setProjects(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const { data } = await api.get('/users', { params: { limit: 100 } });
      setUsers((data.items || []).filter((user) => user.isActive));
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadProjects(filters), 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  const activeDrawerProject = useMemo(() => {
    if (drawerState.mode === 'create') return null;
    return drawerState.project;
  }, [drawerState]);

  function openDocuments(project) {
    if (!project.documents?.length) {
      window.alert('No uploaded documents for this project.');
      return;
    }

    const baseUrl = api.defaults.baseURL.replace('/api', '');
    const urls = project.documents.map((doc) => `${baseUrl}${doc.url}`);

    if (urls.length === 1) {
      window.open(urls[0], '_blank', 'noopener,noreferrer');
    } else {
      // Open a simple view with all document links
      const docWindow = window.open('', '_blank');
      docWindow.document.write(`
        <html>
          <head>
            <title>${project.title} - Documents</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #f9fafb; }
              h1 { color: #1f2937; margin-bottom: 20px; }
              .doc-list { list-style: none; padding: 0; }
              .doc-item { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; padding: 15px; }
              .doc-item a { color: #2563eb; text-decoration: none; font-weight: 500; }
              .doc-item a:hover { text-decoration: underline; }
              .doc-category { font-size: 12px; color: #6b7280; margin-top: 8px; }
            </style>
          </head>
          <body>
            <h1>📄 Project Documents</h1>
            <p style="color: #6b7280; margin-bottom: 20px;">${project.title}</p>
            <ul class="doc-list">
              ${project.documents.map((doc) => `
                <li class="doc-item">
                  <a href="${baseUrl}${doc.url}" target="_blank">${doc.originalName || doc.filename}</a>
                  <div class="doc-category">${DOC_CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category}</div>
                </li>
              `).join('')}
            </ul>
          </body>
        </html>
      `);
    }
  }

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      running: projects.filter((p) => p.projectStatus === 'Running').length,
      finished: projects.filter((p) => p.projectStatus === 'Finished').length,
      blocked: projects.filter((p) => p.projectStatus === 'Blocked').length
    };
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects Management</h1>
          <p className="mt-1 text-sm text-slate-600">Track project delivery, client documents, team assignments & deadlines</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => loadProjects()} className="inline-flex items-center gap-2 rounded-lg px-4 py-2" variant="outline">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={() => setDrawerState({ mode: 'create', project: null })} className="inline-flex items-center gap-2 rounded-lg px-4 py-2">
            <Plus size={16} /> Add New Project
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-slate-600">Total Projects</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{projectStats.total}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <p className="text-sm text-emerald-700">Running</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{projectStats.running}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-slate-400">
            <p className="text-sm text-slate-600">Finished</p>
            <p className="mt-1 text-2xl font-bold text-slate-700">{projectStats.finished}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500">
            <p className="text-sm text-red-700">Blocked</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{projectStats.blocked}</p>
          </Card>
        </div>
      ) : null}

      {/* Filter Bar */}
      <Card className="sticky top-16 z-10 border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-slate-600">Filters</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_180px_1.5fr]">
            <label className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="input w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                title="Start date from"
              />
            </label>
            <label className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="input w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                title="End date to"
              />
            </label>
            <select
              className="input w-full rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All Status</option>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="input w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search by name, client, email..."
              />
            </label>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Projects Table */}
      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700">Project & Client</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Timeline & Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Budget & Team</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
                      Loading projects...
                    </div>
                  </td>
                </tr>
              ) : projects.length ? (
                projects.map((project) => (
                  <tr key={project._id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{project.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{project.client?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{project.client?.email || ''}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-700">
                        {formatDate(project.startDate)} <span className="text-slate-400">→</span> {formatDate(project.deadline)}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(project.projectStatus)}`}>
                          {getStatusIcon(project.projectStatus)}
                          {project.projectStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{formatMoney(project.budget || project.price, project.currency)}</p>
                      <div className="mt-2">
                        <TeamStack team={project.assignedTeam} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDrawerState({ mode: 'edit', project })}
                          className="text-sm font-medium text-blue-600 transition hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDocuments(project)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:underline"
                        >
                          <FileText size={14} /> Docs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan="4">
                    <p className="text-sm">No projects found. Create your first project to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ProjectDrawer
        mode={drawerState.mode}
        project={drawerState.mode === 'create' ? null : activeDrawerProject}
        users={users}
        onClose={() => setDrawerState({ mode: null, project: null })}
        onSave={() => loadProjects()}
      />
    </div>
  );
}
