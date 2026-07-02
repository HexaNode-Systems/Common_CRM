import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRightLeft, CalendarClock, CheckCircle2, FileUp, Globe, LoaderCircle, PencilLine, Phone, Plus, RefreshCw, Search, ShieldAlert, SquarePen, Trash2, Upload, UserRound, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'website_form', label: '🌐 Website Form' },
  { value: 'justdial', label: '☎️ Justdial' },
  { value: 'indiamart', label: '🛒 IndiaMart' },
  { value: 'zoho', label: '💼 Zoho CRM' },
  { value: 'csv_import', label: '📥 Bulk Import CSV' },
  { value: 'manual_entry', label: '✍️ Manual Entry' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Proposal Sent', label: 'Proposal Sent' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' }
];

const STATUS_CLASSES = {
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  'Proposal Sent': 'bg-amber-50 text-amber-700 border-amber-200',
  Negotiation: 'bg-purple-50 text-purple-700 border-purple-200',
  Won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Lost: 'bg-slate-100 text-slate-700 border-slate-300'
};

const SOURCE_META = {
  website_form: { label: '🌐 Website Form', icon: Globe },
  justdial: { label: '☎️ Justdial', icon: Phone },
  indiamart: { label: '🛒 IndiaMart', icon: Globe },
  zoho: { label: '💼 Zoho CRM', icon: UserRound },
  csv_import: { label: '📥 Bulk Import CSV', icon: FileUp },
  manual_entry: { label: '✍️ Manual Entry', icon: PencilLine }
};

const emptyLead = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  whatsapp: '',
  requirements: '',
  source: 'manual_entry',
  assigneeId: ''
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatNoteTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(value));
}

function statusClass(status) {
  return STATUS_CLASSES[status] || STATUS_CLASSES.New;
}

function sourceLabel(source) {
  return SOURCE_META[source]?.label || 'Manual Entry';
}

function LeadSourceBadge({ lead }) {
  const meta = SOURCE_META[lead.source] || SOURCE_META.manual_entry;
  const Icon = meta.icon;

  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <Icon size={14} className="text-primary" />
      <span>{meta.label}</span>
      <span className="text-slate-400">•</span>
      <span>{formatDateTime(lead.ingestedAt)}</span>
    </div>
  );
}

function ImportModal({ onClose, onImport, processing }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!file) {
      setError('Select a CSV file to import.');
      return;
    }
    onImport(file, { setError });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close CSV import" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bulk Import CSV</h2>
            <p className="mt-1 text-sm text-slate-500">Map Name, Phone, Email, and Requirements from your CSV file.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">CSV File</span>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <Upload size={22} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">Drag and drop or choose a CSV file</p>
              <input className="mt-3 w-full text-sm" type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <Button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-4 py-2">
            {processing ? <LoaderCircle size={16} className="animate-spin" /> : <FileUp size={16} />}
            {processing ? 'Importing...' : 'Import CSV'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DuplicateDecisionModal({ duplicates, onSkip, onOverwrite, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close duplicate prompt" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Duplicate Leads Detected</h2>
            <p className="mt-1 text-sm text-slate-500">Skip duplicates or overwrite existing leads?</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"><X size={18} /></button>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto px-5 py-5 text-sm text-slate-600">
          {duplicates.map((item, index) => (
            <div key={`${item.phone}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
              <span className="font-medium text-slate-900">{item.companyName}</span>
              <span className="text-xs text-slate-500">{item.phone} • {item.reason}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onSkip} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Skip Duplicates</button>
          <Button onClick={onOverwrite} className="px-4 py-2">Overwrite Existing Leads</Button>
        </div>
      </div>
    </div>
  );
}

function LeadDrawer({
  mode,
  lead,
  canManage,
  assignees,
  saving,
  onClose,
  onCreate,
  onStatusChange,
  onAssigneeChange,
  onAddNote,
  onDelete,
  currentUser,
  error
}) {
  const [form, setForm] = useState(emptyLead);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (mode === 'create') {
      setForm(emptyLead);
      return;
    }

    setForm({
      companyName: lead?.companyName || '',
      contactName: lead?.contactName || '',
      phone: lead?.phone || '',
      email: lead?.email || '',
      whatsapp: lead?.whatsapp || '',
      requirements: lead?.requirements || '',
      source: lead?.source || 'manual_entry',
      assigneeId: lead?.assignee?._id || lead?.assignee || ''
    });
    setNote('');
  }, [lead, mode]);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const readOnly = mode !== 'create';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onCreate(form);
  }

  const noteFeed = [...(lead?.notes || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close lead drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{mode === 'create' ? 'Add New Lead' : lead?.companyName || 'Lead Details'}</h2>
            <p className="mt-1 text-sm text-slate-500">{mode === 'create' ? 'Capture a manual lead entry.' : 'Lead ownership, timeline notes, and lifecycle control.'}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close lead drawer"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {mode === 'create' ? (
            <form onSubmit={submit} className="space-y-5">
              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Intake</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-slate-700">Lead / Company Name</span><input className="input" required value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} /></label>
                  <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Primary Contact</span><input className="input" value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)} /></label>
                  <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Phone</span><input className="input" required value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></label>
                  <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Email</span><input className="input" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></label>
                  <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">WhatsApp</span><input className="input" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} /></label>
                  <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-slate-700">Requirements</span><textarea className="input min-h-32" value={form.requirements} onChange={(e) => updateField('requirements', e.target.value)} /></label>
                  <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Lead Source</span><select className="input" value={form.source} onChange={(e) => updateField('source', e.target.value)}>{SOURCE_OPTIONS.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  {canManage ? (
                    <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Initial Assignee</span><select className="input" value={form.assigneeId} onChange={(e) => updateField('assigneeId', e.target.value)}><option value="">Unassigned</option>{assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name} ({assignee.role ? assignee.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''})</option>)}</select></label>
                  ) : null}
                </div>
              </section>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                <Button type="submit" disabled={saving} className="px-4 py-2">{saving ? 'Saving...' : 'Create Lead'}</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Snapshot</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="text-sm text-slate-500">Lead / Company Name</p>
                      <p className="text-lg font-semibold text-slate-900">{lead?.companyName}</p>
                      <LeadSourceBadge lead={lead || {}} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Primary Contact</p>
                      <p className="font-medium text-slate-900">{lead?.contactName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phone / WhatsApp</p>
                      <p className="font-medium text-slate-900">{lead?.phone || '-'}{lead?.whatsapp ? ` / ${lead.whatsapp}` : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{lead?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Created</p>
                      <p className="font-medium text-slate-900">{formatDateTime(lead?.createdAt)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-slate-500">Requirements</p>
                      <p className="whitespace-pre-line text-sm text-slate-700">{lead?.requirements || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lifecycle Controls</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
                      <select value={lead?.status || 'New'} onChange={(e) => onStatusChange(e.target.value)} className="input">
                        {STATUS_OPTIONS.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Assignee</span>
                      {canManage ? (
                        <select value={form.assigneeId} onChange={(e) => onAssigneeChange(e.target.value)} className="input">
                          <option value="">Unassigned</option>
                          {assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name} ({assignee.role ? assignee.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''})</option>)}
                        </select>
                      ) : (
                        <div className="input flex items-center justify-between gap-3 bg-slate-50 text-slate-700">
                          <span>{lead?.assignee?.name || 'Unassigned'}</span>
                          {lead?.assignee ? <span className="text-xs text-slate-500">{lead.assignee.role ? lead.assignee.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''}</span> : <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">Unassigned</span>}
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Chronological Notes Feed</h3>
                  <div className="space-y-3">
                    {noteFeed.length ? noteFeed.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{item.message}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No audit notes yet.</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Add Note</h3>
                  <textarea className="input min-h-32" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Client called back, requested pricing for 50 users" />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      onClick={() => onAddNote(note, setNote)}
                      disabled={saving || !note.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2"
                    >
                      <PencilLine size={16} />
                      Add Note
                    </Button>
                  </div>
                </div>

                {isSuperAdmin ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-rose-700">Danger Zone</h3>
                        <p className="mt-1 text-xs text-rose-600">Only super admin can remove a lead record.</p>
                      </div>
                      <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-theme bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                        <Trash2 size={16} />Delete Lead
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function LeadsManagementPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ source: '', status: '', from: '', to: '', assignee: '', search: '' });
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [duplicatePrompt, setDuplicatePrompt] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const canCreateLeads = isSuperAdmin || user?.permissions?.includes('leads:create');
  const canManageLeads = isSuperAdmin || user?.permissions?.includes('leads:update');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [leadRes, assigneeRes] = await Promise.all([
        api.get('/v1/leads', { params }),
        canManageLeads ? api.get('/v1/leads/assignees') : Promise.resolve({ data: { items: [] } })
      ]);
      setLeads(leadRes.data.items || []);
      setAssignees(assigneeRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load leads.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters.source, filters.status, filters.from, filters.to, filters.assignee, filters.search]);

  function openCreate() {
    setSelectedLead(null);
    setDrawerMode('create');
    setError('');
  }

  function openLead(lead) {
    setSelectedLead(lead);
    setDrawerMode('edit');
    setError('');
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedLead(null);
    setError('');
  }

  async function createLead(form) {
    setSaving(true);
    setError('');
    try {
      const payload = {
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        whatsapp: form.whatsapp,
        requirements: form.requirements,
        source: form.source,
        assigneeId: form.assigneeId || undefined
      };
      const { data } = await api.post('/v1/leads', payload);
      setLeads((current) => [data, ...current]);
      closeDrawer();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create lead.');
    } finally {
      setSaving(false);
    }
  }

  async function updateLeadStatus(status) {
    if (!selectedLead) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/v1/leads/${selectedLead._id}/status`, { status });
      setSelectedLead(data);
      setLeads((current) => current.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update lead status.');
    } finally {
      setSaving(false);
    }
  }

  async function updateLeadAssignee(assigneeId) {
    if (!selectedLead) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/v1/leads/${selectedLead._id}/assignee`, { assigneeId });
      setSelectedLead(data);
      setLeads((current) => current.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reroute lead.');
    } finally {
      setSaving(false);
    }
  }

  async function addNote(message, clearNote) {
    if (!selectedLead || !message.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/v1/leads/${selectedLead._id}/notes`, { message });
      setSelectedLead(data);
      setLeads((current) => current.map((item) => (item._id === data._id ? data : item)));
      clearNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add note.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLeadDirectly(leadId) {
    if (!leadId) return;
    if (!window.confirm('Delete this lead permanently?')) return;
    setSaving(true);
    setError('');
    try {
      await api.delete(`/v1/leads/${leadId}`);
      setLeads((current) => current.filter((item) => item._id !== leadId));
      if (selectedLead && selectedLead._id === leadId) {
        closeDrawer();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete lead.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead() {
    if (!selectedLead) return;
    await deleteLeadDirectly(selectedLead._id);
  }

  async function uploadCsv(file, { setError: setModalError }) {
    setImportBusy(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('file', file);
      const { data } = await api.post('/v1/leads/import', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportOpen(false);
      setDuplicatePrompt(null);
      setLeads((current) => [...data.items, ...current]);
      load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.duplicates) {
        setDuplicatePrompt({ file, duplicates: err.response.data.duplicates });
        return;
      }
      setModalError(err.response?.data?.message || 'Unable to import CSV.');
    } finally {
      setImportBusy(false);
    }
  }

  async function continueCsvImport(file, mode) {
    setImportBusy(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('mode', mode);
      const { data } = await api.post('/v1/leads/import', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDuplicatePrompt(null);
      setImportOpen(false);
      setLeads((current) => [...data.items, ...current]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete CSV import.');
    } finally {
      setImportBusy(false);
    }
  }

  const visibleCount = useMemo(() => leads.length, [leads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leads Management</h1>
          <p className="mt-1 text-sm text-slate-600">Secure sales pipeline with source tracking, routing, and immutable note history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={load} className="inline-flex items-center gap-2 px-4 py-2"><RefreshCw size={16} />Refresh</Button>
          {canCreateLeads ? (
            <>
              <Button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2"><Upload size={16} />📥 Bulk Import CSV</Button>
              <Button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2"><PlusIcon />Add New</Button>
            </>
          ) : null}
        </div>
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-200 pb-4 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Source</span>
            <select className="input" value={filters.source} onChange={(e) => setFilters((current) => ({ ...current, source: e.target.value }))}>
              {SOURCE_OPTIONS.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Status</span>
            <select className="input" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
              {STATUS_OPTIONS.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">From Date/Time</span>
            <input type="datetime-local" className="input" value={filters.from} onChange={(e) => setFilters((current) => ({ ...current, from: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">To Date/Time</span>
            <input type="datetime-local" className="input" value={filters.to} onChange={(e) => setFilters((current) => ({ ...current, to: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
            <div className="input flex items-center gap-2">
              <Search size={16} className="text-slate-400" />
              <input className="w-full border-0 bg-transparent p-0 outline-none focus:ring-0" placeholder="Name, phone, email, requirements" value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} />
            </div>
          </label>
          {isSuperAdmin ? (
            <label className="block lg:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee (Admin Only)</span>
              <select className="input" value={filters.assignee} onChange={(e) => setFilters((current) => ({ ...current, assignee: e.target.value }))}>
                <option value="">All Assignees</option>
                {assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name} ({assignee.role ? assignee.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''})</option>)}
              </select>
            </label>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700 w-16">S.No</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Lead Details & Source</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Contact Context</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Assignee User</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Lifecycle Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="6">Loading leads...</td></tr>
              ) : leads.length ? leads.map((lead, index) => (
                <tr key={lead._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 align-top font-semibold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-slate-900">{lead.companyName}</p>
                    <LeadSourceBadge lead={lead} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <span>📞 {lead.phone}</span>
                      </div>
                      {lead.whatsapp && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <span>💬 WhatsApp: {lead.whatsapp}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span>✉️ {lead.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {lead.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{String(lead.assignee.name || 'U').slice(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold text-slate-900">{lead.assignee.name}</p>
                          <p className="text-xs text-slate-500">{lead.assignee.role ? lead.assignee.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''}</p>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => openLead(lead)} className="animate-pulse rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 transition hover:bg-slate-200 animate-pulse">
                        [Unassigned - Click to Route]
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(lead.status)}`}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => openLead(lead)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                        <SquarePen size={14} />View/Edit Details
                      </button>
                      {isSuperAdmin ? (
                        <button type="button" onClick={() => deleteLeadDirectly(lead._id)} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-red-600 transition hover:bg-red-50 hover:text-red-800" aria-label="Delete lead">
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan="6">
                    No leads found. Use Bulk Import CSV, a webhook, or Add New to populate the pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="text-xs text-slate-500">Showing {visibleCount} lead(s).</div>

      {drawerMode ? (
        <LeadDrawer
          mode={drawerMode}
          lead={selectedLead}
          canManage={canManageLeads}
          assignees={assignees}
          saving={saving}
          currentUser={user}
          onClose={closeDrawer}
          onCreate={createLead}
          onStatusChange={updateLeadStatus}
          onAssigneeChange={updateLeadAssignee}
          onAddNote={addNote}
          onDelete={deleteLead}
          error={error}
        />
      ) : null}

      {importOpen ? <ImportModal onClose={() => setImportOpen(false)} onImport={uploadCsv} processing={importBusy} /> : null}
      {duplicatePrompt ? (
        <DuplicateDecisionModal
          duplicates={duplicatePrompt.duplicates}
          onClose={() => setDuplicatePrompt(null)}
          onSkip={() => continueCsvImport(duplicatePrompt.file, 'skip')}
          onOverwrite={() => continueCsvImport(duplicatePrompt.file, 'overwrite')}
        />
      ) : null}
    </div>
  );
}

function PlusIcon() {
  return <Plus size={16} />;
}
