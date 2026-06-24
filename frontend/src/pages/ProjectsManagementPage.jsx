import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, Plus, RefreshCw, Search, UploadCloud, X } from 'lucide-react';
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
  return new Intl.DateTimeFormat('en-GB').format(new Date(value));
}

function formatMoney(amount, currency = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function statusClass(status) {
  if (status === 'Running') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Finished') return 'bg-slate-100 text-slate-600';
  if (status === 'Blocked') return 'bg-red-50 text-red-700';
  return 'bg-blue-50 text-blue-700';
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

function TeamStack({ team = [] }) {
  if (!team.length) return <span className="text-xs text-slate-500">Unassigned</span>;
  const visible = team.slice(0, 4);
  return (
    <div className="flex items-center">
      {visible.map((member, index) => (
        <div
          key={member.user || member.email || index}
          title={`${member.name} - ${member.role || 'Team Member'}`}
          className="-ml-2 first:ml-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-[11px] font-bold text-white shadow-sm"
        >
          {initials(member.name)}
        </div>
      ))}
      {team.length > visible.length ? (
        <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-bold text-slate-700">
          +{team.length - visible.length}
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

  useEffect(() => {
    if (!project) {
      setForm(emptyForm);
      setFiles([]);
      setError('');
      setCapacityWarnings([]);
      return;
    }

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
    setFiles([]);
    setError('');
    setCapacityWarnings([]);
  }, [project]);

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close project drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{mode === 'create' ? 'Add New Project' : `Edit Project - ${project.title}`}</h2>
            <p className="mt-1 text-sm text-slate-500">Client delivery, team, financials, timeline, and documents.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close" title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5">
          {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {capacityWarnings.length ? (
            <div className="mb-4 space-y-2 rounded-theme border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {capacityWarnings.map((warning) => <p key={warning.userId}>{warning.message}</p>)}
            </div>
          ) : null}

          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Client Context & Contact Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Client Name / Company Name</span><input className="input" value={form.clientName} onChange={(e) => updateField('clientName', e.target.value)} placeholder="Client company" required /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Point of Contact Email</span><input className="input" type="email" value={form.clientEmail} onChange={(e) => updateField('clientEmail', e.target.value)} placeholder="client@example.com" required /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Phone / WhatsApp</span><input className="input" inputMode="numeric" value={form.clientPhone} onChange={(e) => updateField('clientPhone', e.target.value.replace(/[^0-9+ -]/g, ''))} placeholder="+91 98765 43210" /></label>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Project Parameters & Deadlines</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Project Name / Title</span><input className="input" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Project title" required /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Project Status</span><select className="input" value={form.projectStatus} onChange={(e) => updateField('projectStatus', e.target.value)}>{PROJECT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="block md:col-span-2"><span className="mb-1 block text-sm font-medium text-slate-700">Project Description</span><textarea className="input min-h-24" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Scope details, deliverables, constraints" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Start Date</span><input className="input" type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} required /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Deadline / Target End Date</span><input className="input" type="date" value={form.deadline} min={form.startDate || undefined} onChange={(e) => updateField('deadline', e.target.value)} required /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Project Budget</span><input className="input" type="number" min="0" step="1" value={form.budget} onChange={(e) => updateField('budget', e.target.value)} placeholder="15000" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Currency</span><select className="input" value={form.currency} onChange={(e) => updateField('currency', e.target.value)}><option value="INR">INR</option><option value="USD">USD</option></select></label>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Operational Resource Mapping</h3>
            <div className="max-h-56 overflow-y-auto rounded-theme border border-slate-200 bg-slate-50 p-3">
              {users.length ? users.map((user) => (
                <label key={user._id} className="flex items-center justify-between gap-3 rounded-theme px-3 py-2 transition hover:bg-white">
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{user.name}</span>
                    <span className="block text-xs text-slate-500">{user.role} - {user.email}</span>
                  </span>
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.assignedUserIds.includes(String(user._id))} onChange={() => toggleUser(String(user._id))} />
                </label>
              )) : <p className="px-3 py-2 text-sm text-slate-500">No active users available.</p>}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Unified Storage & Client Document Upload</h3>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-theme border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:bg-white">
              <UploadCloud className="mb-2 text-slate-400" size={28} />
              <span className="text-sm font-medium text-slate-700">Drop files here or choose documents</span>
              <span className="mt-1 text-xs text-slate-500">Agreement, PRD, invoice, and other project attachments</span>
              <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
            {files.length ? (
              <div className="mt-3 divide-y divide-slate-100 rounded-theme border border-slate-200">
                {files.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="truncate text-sm font-medium text-slate-800">{item.file.name}</span>
                    <div className="flex items-center gap-2">
                      <select className="input w-56" value={item.category} onChange={(e) => updateFileCategory(index, e.target.value)}>
                        {DOC_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </select>
                      <button type="button" onClick={() => removeFile(index)} className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Remove file" title="Remove file"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="sticky bottom-0 mt-6 flex items-center justify-end gap-2 border-t border-slate-200 bg-white py-4">
            <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
            <Button disabled={saving} type="submit" className="px-4 py-2">{saving ? 'Saving...' : 'Save Project'}</Button>
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
    const firstDocument = project.documents?.[0];
    if (firstDocument?.url) {
      window.open(`${api.defaults.baseURL.replace('/api', '')}${firstDocument.url}`, '_blank', 'noopener,noreferrer');
      return;
    }
    window.alert('No uploaded documents found for this project.');
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Projects Management</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => loadProjects()} className="inline-flex items-center gap-2 px-3 py-2"><RefreshCw size={16} />Refresh</Button>
          <Button onClick={() => setDrawerState({ mode: 'create', project: null })} className="inline-flex items-center gap-2 px-3 py-2"><Plus size={16} />Add New</Button>
        </div>
      </div>

      <div className="sticky top-16 z-10 mb-4 rounded-theme border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_220px_1.4fr]">
          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="input pl-10" type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          </label>
          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="input pl-10" type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
          </label>
          <select className="input" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="input pl-10" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search project, client, or email" />
          </label>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-3">Project Name & Client Name</th>
                <th className="px-3 py-3">Timeline & Status</th>
                <th className="px-3 py-3">Financials & Team</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-3 py-4" colSpan="4">Loading...</td></tr>
              ) : projects.length ? projects.map((project) => (
                <tr key={project._id} className="transition hover:bg-slate-50">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-slate-900">{project.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{project.client?.name || '-'}</p>
                    <p className="text-xs text-slate-400">{project.client?.email || ''}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-sm font-medium text-slate-800">{formatDate(project.startDate)} -> {formatDate(project.deadline)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(project.projectStatus)}`}>{project.projectStatus}</span>
                  </td>
                  <td className="px-3 py-4">
                    <p className="mb-2 font-semibold text-slate-900">{formatMoney(project.budget || project.price, project.currency)}</p>
                    <TeamStack team={project.assignedTeam} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => setDrawerState({ mode: 'edit', project })} className="font-semibold text-primary transition hover:underline">Edit</button>
                      <button type="button" onClick={() => openDocuments(project)} className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline"><FileText size={15} />Documents</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-3 py-6 text-slate-500" colSpan="4">No records found.</td></tr>
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
