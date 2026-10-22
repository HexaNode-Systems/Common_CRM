import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Database, FileUp, Globe, History, LoaderCircle, Mail, MessageSquare,
  PencilLine, Phone, Plus, RefreshCw, Search, ShoppingBag, SquarePen, Trash2, Upload, X
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import Loader from '../components/Loader.jsx';

const PAGE_SIZE = 50;

const SOURCE_META = {
  website_form: { label: 'Website Form', icon: Globe },
  justdial: { label: 'Justdial', icon: Phone },
  indiamart: { label: 'IndiaMart', icon: ShoppingBag },
  zoho: { label: 'Zoho CRM', icon: Database },
  csv_import: { label: 'CSV Import', icon: FileUp },
  manual_entry: { label: 'Manual Entry', icon: PencilLine }
};
const SOURCES = Object.entries(SOURCE_META).map(([value, meta]) => ({ value, label: meta.label }));
const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const STATUS_CLASSES = {
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  'Proposal Sent': 'bg-amber-50 text-amber-700 border-amber-200',
  Negotiation: 'bg-purple-50 text-purple-700 border-purple-200',
  Won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Lost: 'bg-slate-100 text-slate-700 border-slate-300'
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyLead = {
  companyName: '', contactName: '', phone: '', email: '', whatsapp: '', requirements: '', source: 'manual_entry', assigneeId: '', status: 'New'
};

function roleLabel(role) {
  return role ? role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

// Shown in the viewer's own time zone.
function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(d);
}

// datetime-local gives local wall time; send an exact instant so the server doesn't guess the zone.
function toIso(local) {
  if (!local) return '';
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

/** Client-side check before sending; the server checks again. */
function leadFormError(form) {
  if (!form.companyName.trim()) return 'Lead / company name is required.';
  const digits = form.phone.replace(/\D/g, '');
  if (!form.phone.trim()) return 'Phone number is required.';
  if (/e\+?\d+$/i.test(form.phone.trim())) return 'Phone looks like an Excel number (E+). Type the full number.';
  if (digits.length < 7 || digits.length > 15) return 'Phone number should have 7 to 15 digits.';
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return 'Enter a valid email address.';
  return '';
}

function LeadSourceBadge({ lead }) {
  const meta = SOURCE_META[lead.source] || SOURCE_META.manual_entry;
  const Icon = meta.icon;
  const latest = lead.latestSource && lead.latestSource !== lead.source ? SOURCE_META[lead.latestSource]?.label : null;
  return (
    <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <Icon size={14} className="text-primary" />
      <span>{meta.label}</span>
      {latest ? <span className="text-slate-400">· again via {latest}</span> : null}
      <span className="text-slate-400">•</span>
      <span>{formatDateTime(lead.ingestedAt)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSV import                                                          */
/* ------------------------------------------------------------------ */

function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState(null); // 409 duplicates
  const [result, setResult] = useState(null);

  async function send(mode) {
    if (!file) {
      setError('Choose a CSV file to import.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      if (mode) body.append('mode', mode);
      const { data } = await api.post('/v1/leads/import', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPrompt(null);
      setResult(data);
      onDone();
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.duplicates) setPrompt(err.response.data);
      else setError(errMsg(err, 'Unable to import CSV.'));
    } finally {
      setBusy(false);
    }
  }

  const issues = result ? [...(result.errors || []).map((e) => ({ ...e, kind: 'Error' })), ...(result.skipped || []).map((s) => ({ row: s.row, message: `${s.companyName || ''} ${s.phone || ''}: ${s.reason}`, kind: 'Skipped' }))] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close CSV import" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-theme bg-white shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bulk Import CSV</h2>
            <p className="mt-1 text-sm text-slate-500">Columns: Name, Phone (required), Email, Contact, WhatsApp, Requirements.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}

          {result ? (
            <div className="space-y-3">
              <p className="rounded-theme bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{result.message}</p>
              {issues.length ? (
                <div className="max-h-64 overflow-y-auto rounded-theme border border-slate-200">
                  {issues.map((item, index) => (
                    <div key={index} className="flex gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                      <span className={`w-16 shrink-0 text-xs font-semibold ${item.kind === 'Error' ? 'text-red-600' : 'text-slate-500'}`}>{item.kind}</span>
                      <span className="w-14 shrink-0 text-xs text-slate-500">{item.row ? `Row ${item.row}` : ''}</span>
                      <span className="text-slate-700">{item.message}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : prompt ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800">{prompt.message}</p>
              <div className="max-h-64 overflow-y-auto rounded-theme border border-slate-200">
                {prompt.duplicates.map((item, index) => (
                  <div key={`${item.phone}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                    <span className="font-medium text-slate-900">{item.row ? `Row ${item.row}: ` : ''}{item.companyName}</span>
                    <span className="text-right text-xs text-slate-500">{item.phone} · {item.reason}</span>
                  </div>
                ))}
              </div>
              {prompt.errors?.length ? <p className="text-xs text-red-600">{prompt.errors.length} row(s) have errors and will be skipped either way.</p> : null}
              <p className="text-xs text-slate-500">Overwrite replaces name, contact, email and requirements. Owner, status, notes and the original source are kept.</p>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">CSV File</span>
              <div className="rounded-theme border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <Upload size={22} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">Choose a CSV file (up to 5,000 rows)</p>
                <input className="mt-3 w-full text-sm" type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </label>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          {result ? (
            <Button onClick={onClose}>Done</Button>
          ) : prompt ? (
            <>
              <Button variant="outline" disabled={busy} onClick={() => send('skip')}>Skip Existing</Button>
              <Button disabled={busy} onClick={() => send('overwrite')}>{busy ? 'Importing...' : 'Overwrite Details'}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button disabled={busy} onClick={() => send('')} className="gap-2">
                {busy ? <LoaderCircle size={16} className="animate-spin" /> : <FileUp size={16} />}
                {busy ? 'Importing...' : 'Import CSV'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

function Timeline({ lead }) {
  const items = useMemo(() => {
    const notes = (lead?.notes || []).map((n) => ({ kind: 'note', at: n.createdAt, who: `${n.addedByName} (${roleLabel(n.addedByRole)})`, text: n.message }));
    const activity = (lead?.activity || []).map((a) => {
      let text = a.message || '';
      if (a.type === 'status') text = `Status ${a.from} → ${a.to}`;
      if (a.type === 'assigned') text = a.to ? `${a.message || 'Assigned'}${a.from ? `: ${a.from} → ${a.to}` : ` to ${a.to}`}` : `Unassigned${a.from ? ` (was ${a.from})` : ''}`;
      if (a.type === 'reenquiry' && a.to) text = `${a.message || 'Enquired again'} (via ${SOURCE_META[a.to]?.label || a.to})`;
      return { kind: 'activity', at: a.at, who: a.byName || 'System', text };
    });
    return [...notes, ...activity].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [lead]);

  if (!items.length) return <p className="text-sm text-slate-500">No history yet.</p>;
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className={item.kind === 'note' ? 'rounded-theme bg-slate-50 p-3' : 'flex gap-2 px-1 text-xs text-slate-500'}>
          {item.kind === 'note' ? (
            <>
              <p className="text-xs font-semibold text-slate-500">{item.who} · {formatDateTime(item.at)}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{item.text}</p>
            </>
          ) : (
            <>
              <History size={13} className="mt-0.5 shrink-0 text-slate-400" />
              <span><span className="font-semibold text-slate-600">{item.text}</span> · {item.who} · {formatDateTime(item.at)}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function LeadDrawer({ mode, lead, canEdit, canRoute, assignees, saving, error, success, onClose, onCreate, onSave, onDelete, onOpenExisting }) {
  const [form, setForm] = useState(emptyLead);
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setLocalError('');
    setNote('');
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
      status: lead?.status || 'New',
      assigneeId: lead?.assignee?._id || lead?.assignee || ''
    });
  }, [lead, mode]);

  const readOnly = mode !== 'create' && !canEdit;
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const changes = useMemo(() => {
    if (mode === 'create' || !lead) return {};
    const out = {};
    for (const key of ['companyName', 'contactName', 'phone', 'email', 'whatsapp', 'requirements', 'status']) {
      if (form[key] !== (lead[key] || (key === 'status' ? 'New' : ''))) out[key] = form[key];
    }
    if (canRoute && form.source !== (lead.source || 'manual_entry')) out.source = form.source;
    const originalAssignee = lead.assignee?._id || lead.assignee || '';
    if (canRoute && form.assigneeId !== originalAssignee) out.assigneeId = form.assigneeId || null;
    return out;
  }, [form, lead, mode, canRoute]);

  const isDirty = mode === 'create' || Object.keys(changes).length > 0 || note.trim().length > 0;

  function submit(event) {
    event.preventDefault();
    if (readOnly) return;
    const problem = leadFormError(form);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError('');
    if (mode === 'create') onCreate(form);
    else onSave({ ...changes, note: note.trim() || undefined }, () => setNote(''));
  }

  const shownError = localError || error?.message || '';
  const field = (label, key, props = {}) => (
    <label className={`block ${props.wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {props.textarea ? (
        <textarea className="input min-h-24" value={form[key]} disabled={readOnly} maxLength={5000} onChange={(e) => update(key, e.target.value)} />
      ) : (
        <input className="input" type={props.type || 'text'} value={form[key]} disabled={readOnly} maxLength={props.max || 200} onChange={(e) => update(key, e.target.value)} />
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close lead drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{mode === 'create' ? 'Add New Lead' : lead?.companyName || 'Lead Details'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'create' ? 'Capture a manual lead entry.' : readOnly ? 'View only. You don’t have permission to edit leads.' : 'Details, status, owner and full history.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close lead drawer"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {shownError ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                <span>{shownError}</span>
                {error?.existingId ? <button type="button" onClick={() => onOpenExisting(error.existingId)} className="font-semibold underline">Open existing lead</button> : null}
              </div>
            ) : null}
            {success ? <p className="mb-4 rounded-theme bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

            <div className={mode === 'create' ? '' : 'grid gap-5 lg:grid-cols-[1.1fr_0.9fr]'}>
              <section className="space-y-4">
                <div className="rounded-theme border border-slate-200 p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{mode === 'create' ? 'Lead Intake' : 'Lead Details'}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field('Lead / Company Name *', 'companyName', { wide: true })}
                    {field('Primary Contact', 'contactName')}
                    {field('Phone *', 'phone', { max: 30 })}
                    {field('Email', 'email', { type: 'email' })}
                    {field('WhatsApp', 'whatsapp', { max: 30 })}
                    {field('Requirements', 'requirements', { wide: true, textarea: true })}
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">{mode === 'create' ? 'Lead Source' : 'First Source'}</span>
                      <select className="input" value={form.source} disabled={mode !== 'create' && !canRoute} onChange={(e) => update('source', e.target.value)}>
                        {SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                      {mode !== 'create' && lead?.latestSource && lead.latestSource !== lead.source ? (
                        <span className="mt-1 block text-xs text-slate-500">Latest enquiry via {SOURCE_META[lead.latestSource]?.label}</span>
                      ) : null}
                    </label>
                    {mode === 'create' && canRoute ? (
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Owner</span>
                        <select className="input" value={form.assigneeId} onChange={(e) => update('assigneeId', e.target.value)}>
                          <option value="">Use distribution rules</option>
                          {assignees.map((a) => <option key={a._id} value={a._id}>{a.name} ({roleLabel(a.role)})</option>)}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </div>

                {mode !== 'create' ? (
                  <div className="rounded-theme border border-slate-200 p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status & Owner</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
                        <select value={form.status} disabled={readOnly} onChange={(e) => update('status', e.target.value)} className="input">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Owner</span>
                        {canRoute ? (
                          <select value={form.assigneeId} onChange={(e) => update('assigneeId', e.target.value)} className="input">
                            <option value="">Unassigned</option>
                            {assignees.map((a) => <option key={a._id} value={a._id}>{a.name} ({roleLabel(a.role)})</option>)}
                          </select>
                        ) : (
                          <div className="input flex items-center justify-between gap-3 bg-slate-50 text-slate-700">
                            <span>{lead?.assignee?.name || 'Unassigned'}</span>
                            <span className="text-xs text-slate-500">{roleLabel(lead?.assignee?.role)}</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                ) : null}
              </section>

              {mode !== 'create' ? (
                <section className="space-y-4">
                  <div className="rounded-theme border border-slate-200 p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">History & Notes</h3>
                    <Timeline lead={lead} />
                  </div>
                  {!readOnly ? (
                    <div className="rounded-theme border border-slate-200 p-4">
                      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Add Note</h3>
                      <p className="mb-2 text-xs text-slate-500">Notes are permanent and can’t be edited later.</p>
                      <textarea className="input min-h-28" value={note} maxLength={5000} onChange={(e) => setNote(e.target.value)} placeholder="Client called back, requested pricing for 50 users" />
                    </div>
                  ) : null}
                  {canRoute ? (
                    <div className="rounded-theme border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-rose-700">Delete lead</h3>
                          <p className="mt-1 text-xs text-rose-600">Removes the lead and all its notes permanently.</p>
                        </div>
                        <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-theme bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                          <Trash2 size={16} />Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
            <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
            {!readOnly ? (
              <Button type="submit" disabled={saving || !isDirty}>
                {saving ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Save Changes'}
              </Button>
            ) : null}
          </div>
        </form>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LeadsManagementPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState('own');
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [drawerError, setDrawerError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ source: '', status: '', from: '', to: '', assignee: '', search: searchParams.get('search') || '' });
  const [search, setSearch] = useState(filters.search);
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const requestId = useRef(0);

  const perms = user?.permissions || [];
  const isSuperAdmin = user?.role === 'super_admin';
  // The server lets "Update" access add leads too, so the buttons follow that.
  const canCreate = isSuperAdmin || perms.includes('leads:create') || perms.includes('leads:update');
  const canEdit = isSuperAdmin || perms.includes('leads:update');
  const canRoute = isSuperAdmin || perms.includes('leads:delete') || scope === 'all';

  async function load(nextPage = page) {
    const id = ++requestId.current;
    setLoading(true);
    setPageError('');
    try {
      const params = { page: nextPage, limit: PAGE_SIZE };
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        params[key] = key === 'from' || key === 'to' ? toIso(value) : value;
      }
      const { data } = await api.get('/v1/leads', { params });
      if (id !== requestId.current) return; // a newer search has started; ignore this answer
      setLeads(data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: (data.items || []).length });
      setScope(data.scope || 'own');
    } catch (err) {
      if (id === requestId.current) setPageError(errMsg(err, 'Unable to load leads.'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!canRoute && !canEdit) return;
    api.get('/v1/leads/assignees').then(({ data }) => setAssignees(data.items || [])).catch(() => setAssignees([]));
  }, [canRoute, canEdit]);

  useEffect(() => {
    const value = searchParams.get('search');
    if (value !== null) {
      setSearch(value);
      setFilters((current) => ({ ...current, search: value }));
    }
  }, [searchParams]);

  // Wait until typing pauses before searching.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => (current.search === search ? current : { ...current, search }));
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => { load(page); }, [filters, page]);

  function setFilter(key, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setSelectedLead(null);
    setDrawerMode('create');
    setDrawerError(null);
    setSuccess('');
  }

  async function openLead(lead) {
    setSelectedLead(lead);
    setDrawerMode('edit');
    setDrawerError(null);
    setSuccess('');
    try {
      const { data } = await api.get(`/v1/leads/${lead._id}`); // full history
      setSelectedLead(data);
    } catch (err) {
      setDrawerError({ message: errMsg(err, 'Unable to load this lead.') });
    }
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedLead(null);
    setDrawerError(null);
    setSuccess('');
  }

  async function createLead(form) {
    setSaving(true);
    setDrawerError(null);
    try {
      await api.post('/v1/leads', {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        requirements: form.requirements.trim(),
        source: form.source,
        assigneeId: form.assigneeId || undefined
      });
      closeDrawer();
      setPage(1);
      load(1);
    } catch (err) {
      setDrawerError({ message: errMsg(err, 'Unable to create lead.'), existingId: err.response?.data?.existingId });
    } finally {
      setSaving(false);
    }
  }

  async function saveLead(changes, done) {
    if (!selectedLead) return;
    setSaving(true);
    setDrawerError(null);
    setSuccess('');
    try {
      const { data } = await api.put(`/v1/leads/${selectedLead._id}`, changes);
      setSelectedLead(data);
      // An agent who hands a lead on would no longer see it; keep the list honest.
      setLeads((current) => current.map((item) => (item._id === data._id ? data : item)));
      setSuccess('Lead updated.');
      done?.();
    } catch (err) {
      setDrawerError({ message: errMsg(err, 'Unable to save lead changes.') });
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(leadId) {
    if (!leadId || !window.confirm('Delete this lead and all its notes permanently?')) return;
    setSaving(true);
    try {
      await api.delete(`/v1/leads/${leadId}`);
      if (selectedLead?._id === leadId) closeDrawer();
      load(page);
    } catch (err) {
      const message = errMsg(err, 'Unable to delete lead.');
      if (drawerMode) setDrawerError({ message });
      else setPageError(message);
    } finally {
      setSaving(false);
    }
  }

  const firstRow = pagination.total ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(pagination.page * PAGE_SIZE, pagination.total);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        label="Pipeline"
        title="Leads Management"
        description="Sales pipeline with source tracking, routing, and permanent note history."
        actions={
          <>
            <Button variant="outline" onClick={() => load(page)} className="gap-2"><RefreshCw size={15} />Refresh</Button>
            {canCreate && (
              <>
                <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><Upload size={15} />Bulk Import CSV</Button>
                <Button onClick={openCreate} className="gap-2"><Plus size={15} />Add New</Button>
              </>
            )}
          </>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-slate-200 pb-4 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Source</span>
            <select className="input" value={filters.source} onChange={(e) => setFilter('source', e.target.value)}>
              <option value="">All Sources</option>
              {SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Status</span>
            <select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">From</span>
            <input type="datetime-local" className="input" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">To</span>
            <input type="datetime-local" className="input" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
            <div className="input flex items-center gap-2">
              <Search size={16} className="text-slate-400" />
              <input className="w-full border-0 bg-transparent p-0 outline-none focus:ring-0" placeholder="Name, phone, email, requirements" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </label>
          {canRoute ? (
            <label className="block lg:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
              <select className="input" value={filters.assignee} onChange={(e) => setFilter('assignee', e.target.value)}>
                <option value="">Everyone</option>
                <option value="unassigned">Unassigned only</option>
                {assignees.map((a) => <option key={a._id} value={a._id}>{a.name} ({roleLabel(a.role)})</option>)}
              </select>
            </label>
          ) : null}
        </div>

        {pageError ? <p className="mt-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{pageError}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="w-16 px-4 py-3 font-semibold text-slate-700">S.No</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Lead & Source</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Contact</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Owner</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6"><Loader label="Loading leads" /></td></tr>
              ) : leads.length ? leads.map((lead, index) => (
                <tr key={lead._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 align-top font-semibold text-slate-500">{firstRow + index}</td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-slate-900">{lead.companyName}</p>
                    <LeadSourceBadge lead={lead} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><Phone size={13} className="shrink-0 text-slate-400" /><span>{lead.phone}</span></div>
                      {lead.whatsapp && lead.whatsapp !== lead.phone ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><MessageSquare size={13} className="shrink-0 text-emerald-500" /><span>WhatsApp: {lead.whatsapp}</span></div>
                      ) : null}
                      {lead.email ? <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail size={13} className="shrink-0 text-slate-400" /><span>{lead.email}</span></div> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {lead.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{String(lead.assignee.name || 'U').slice(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold text-slate-900">{lead.assignee.name}</p>
                          <p className="text-xs text-slate-500">{roleLabel(lead.assignee.role)}</p>
                        </div>
                      </div>
                    ) : canRoute ? (
                      <button type="button" onClick={() => openLead(lead)} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100">
                        Unassigned · Assign
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[lead.status] || STATUS_CLASSES.New}`}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => openLead(lead)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                        <SquarePen size={14} />{canEdit ? 'View / Edit' : 'View'}
                      </button>
                      {canRoute ? (
                        <button type="button" onClick={() => deleteLead(lead._id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 hover:text-red-800" aria-label="Delete lead">
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan="6">
                    {hasFilters ? 'No leads match these filters.' : scope === 'own' ? 'No leads are assigned to you yet.' : 'No leads yet. Use Bulk Import CSV, a webhook, or Add New.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total > 0 ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-1 pt-3 text-sm text-slate-500">
            <span>Showing {firstRow}–{lastRow} of {pagination.total}{scope === 'own' ? ' leads assigned to you' : ''}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1"><ChevronLeft size={14} />Prev</Button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="gap-1">Next<ChevronRight size={14} /></Button>
            </div>
          </div>
        ) : null}
      </Card>

      {drawerMode ? (
        <LeadDrawer
          mode={drawerMode}
          lead={selectedLead}
          canEdit={canEdit}
          canRoute={canRoute}
          assignees={assignees}
          saving={saving}
          error={drawerError}
          success={success}
          onClose={closeDrawer}
          onCreate={createLead}
          onSave={saveLead}
          onDelete={() => deleteLead(selectedLead?._id)}
          onOpenExisting={(id) => openLead({ _id: id })}
        />
      ) : null}

      {importOpen ? <ImportModal onClose={() => setImportOpen(false)} onDone={() => { setPage(1); load(1); }} /> : null}
    </div>
  );
}
