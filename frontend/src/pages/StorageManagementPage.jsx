import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Download, FolderSearch, PencilLine, Plus, RefreshCw, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { downloadError, downloadFile } from '../utils/download.js';

const MAX_MB = 25;
const ALLOWED = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg'];

const TABS = [
  { key: 'all', label: 'All Documents' },
  { key: 'hr', label: 'HR & Personnel' },
  { key: 'agreement', label: 'Client Agreements' },
  { key: 'project', label: 'Project Files' },
  { key: 'invoice', label: 'Financial Documents' }
];

const CATEGORIES = [
  { value: 'hr', label: 'HR (about an employee)' },
  { value: 'agreement', label: 'Client agreement' },
  { value: 'project', label: 'Project file' },
  { value: 'invoice', label: 'Invoice / finance' }
];

const TIERS = [
  { value: 'project_team', label: 'Team: the project team (or the employee) and managers', level: 'all' },
  { value: 'hr_management', label: 'HR & Management: storage managers only', level: 'manager' },
  { value: 'super_admin', label: 'Super Admin only', level: 'super' }
];

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatSize(bytes) {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function extLabel(name = '') {
  return String(name).includes('.') ? String(name).split('.').pop().toUpperCase() : 'FILE';
}

function fileProblem(file) {
  if (!file) return '';
  const ext = file.name.split('.').pop().toLowerCase();
  if (!file.name.includes('.') || !ALLOWED.includes(ext)) return `"${file.name}" isn't an allowed type. Use PDF, Word, Excel, PowerPoint, text, CSV or images.`;
  if (file.size > MAX_MB * 1024 * 1024) return `Files can be at most ${MAX_MB} MB.`;
  return '';
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

const TIER_STYLES = {
  super_admin: 'bg-rose-50 text-rose-700',
  hr_management: 'bg-amber-50 text-amber-700',
  project_team: 'bg-blue-50 text-blue-700'
};

/* ---------- Upload / edit modal ---------- */

function DocumentModal({ mode, doc, canManage, isSuperAdmin, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: doc?.title || '',
    category: doc?.category || 'project',
    associationId: doc?.associationId ? String(doc.associationId) : '',
    accessTier: doc?.accessTier || 'project_team'
  }));
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Employees for HR files, otherwise the projects you can file under.
  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    api.get('/v1/storage/lookup', { params: { category: form.category } })
      .then(({ data }) => { if (!cancelled) setOptions(data.items || []); })
      .catch((err) => { if (!cancelled) setError(errMsg(err, 'Unable to load the list.')); })
      .finally(() => { if (!cancelled) setOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [form.category]);

  const tiers = TIERS.filter((t) => t.level === 'all' || (t.level === 'manager' && (canManage || isSuperAdmin)) || (t.level === 'super' && isSuperAdmin) || t.value === doc?.accessTier);
  const tierLocked = mode === 'edit' && !canManage && !isSuperAdmin;
  const isHr = form.category === 'hr';

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      // HR files are about an employee; other files belong to a project.
      if (field === 'category' && (value === 'hr') !== (current.category === 'hr')) next.associationId = '';
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (mode === 'create' && !file) return setError('Choose a file to upload.');
    const problem = fileProblem(file);
    if (problem) return setError(problem);
    if (!form.associationId) return setError(isHr ? 'Choose the employee this file is about.' : 'Choose the project this file belongs to.');

    const body = new FormData();
    if (file) body.append('file', file);
    body.append('title', form.title.trim());
    body.append('category', form.category);
    body.append('associationId', form.associationId);
    if (!tierLocked) body.append('accessTier', form.accessTier);

    setSaving(true);
    try {
      const { data } = mode === 'create'
        ? await api.post('/v1/storage', body, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.put(`/v1/storage/${doc._id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved(data, mode);
    } catch (err) {
      setError(errMsg(err, mode === 'create' ? 'Unable to upload document.' : 'Unable to save changes.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <form onSubmit={submit} className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-theme bg-white shadow-2xl sm:max-h-[88dvh] sm:max-w-2xl sm:rounded-theme" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{mode === 'create' ? 'Upload Document' : 'Edit Document'}</h2>
            <p className="mt-1 text-sm text-slate-500">Files are private. Only the people the privacy setting allows can see or download them.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
            <input className="input" value={form.title} maxLength={200} onChange={(e) => update('title', e.target.value)} placeholder={mode === 'create' ? 'Defaults to the file name' : ''} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
              <select className="input" value={form.category} onChange={(e) => update('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{isHr ? 'Employee' : 'Project'}</span>
              <select className="input" value={form.associationId} onChange={(e) => update('associationId', e.target.value)} disabled={optionsLoading}>
                <option value="">{optionsLoading ? 'Loading...' : isHr ? 'Choose employee' : 'Choose project'}</option>
                {options.map((item) => <option key={item._id} value={item._id}>{item.name || item.title}</option>)}
              </select>
              {!optionsLoading && !isHr && !options.length ? <span className="mt-1 block text-xs text-slate-500">You aren't on any project yet.</span> : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Who can see it</span>
            <select className="input" value={form.accessTier} onChange={(e) => update('accessTier', e.target.value)} disabled={tierLocked}>
              {tiers.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {tierLocked ? <span className="mt-1 block text-xs text-slate-500">Only storage managers can change this.</span> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{mode === 'create' ? 'File' : 'Replace file (optional)'}</span>
            <div className="rounded-theme border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center sm:p-5">
              <Upload size={22} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">PDF, Word, Excel, PowerPoint, text, CSV or images · up to {MAX_MB} MB</p>
              <input className="mt-3 w-full text-sm" type="file" accept={ALLOWED.map((e) => `.${e}`).join(',')} onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); setError(fileProblem(f)); }} />
              {file ? <p className="mt-2 break-all text-xs text-slate-500">{file.name} · {formatSize(file.size)}</p> : mode === 'edit' ? <p className="mt-2 break-all text-xs text-slate-500">Current: {doc.originalName}</p> : null}
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : mode === 'create' ? 'Upload Document' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Page ---------- */

export default function StorageManagementPage() {
  const { user } = useAuth();
  const perms = user?.permissions || [];
  const isSuperAdmin = user?.role === 'super_admin';
  // The server lets "Update" access upload too.
  const canUpload = isSuperAdmin || perms.includes('storage:create') || perms.includes('storage:update');
  const canEdit = isSuperAdmin || perms.includes('storage:update');
  const canManage = isSuperAdmin || perms.includes('storage:delete');

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showArchive, setShowArchive] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null); // { mode, doc }
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeTab !== 'all') params.tab = activeTab;
      if (showArchive) params.archived = 'true';
      if (query) params.search = query;
      const { data } = await api.get('/v1/storage', { params });
      if (id !== requestId.current) return;
      setItems(data.items || []);
    } catch (err) {
      if (id === requestId.current) setError(errMsg(err, 'Unable to load documents.'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [activeTab, showArchive, query]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  }

  async function download(doc) {
    setBusyId(doc._id);
    setError('');
    try {
      await downloadFile(`/v1/storage/${doc._id}/download`, doc.originalName);
    } catch (err) {
      setError(await downloadError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function act(doc, action) {
    const prompts = {
      archive: `Archive "${doc.title}"? Managers can restore it from the archive.`,
      delete: `Delete "${doc.title}" permanently? The file is removed from the server and can't be recovered.`
    };
    if (prompts[action] && !window.confirm(prompts[action])) return;
    setBusyId(doc._id);
    setError('');
    try {
      if (action === 'archive') await api.patch(`/v1/storage/${doc._id}/archive`);
      if (action === 'restore') await api.patch(`/v1/storage/${doc._id}/restore`);
      if (action === 'delete') await api.delete(`/v1/storage/${doc._id}`);
      setItems((current) => current.filter((item) => item._id !== doc._id));
      flash(action === 'archive' ? 'Document archived.' : action === 'restore' ? 'Document restored.' : 'Document deleted.');
    } catch (err) {
      setError(errMsg(err, 'That didn’t work. Try again.'));
    } finally {
      setBusyId(null);
    }
  }

  function saved(doc, mode) {
    setModal(null);
    flash(mode === 'create' ? 'Document uploaded.' : 'Changes saved.');
    load();
  }

  const empty = useMemo(() => {
    if (query) return 'No documents match your search.';
    if (showArchive) return 'The archive is empty.';
    return 'No documents here yet.';
  }, [query, showArchive]);

  function Actions({ item }) {
    const busy = busyId === item._id;
    const linkClass = 'inline-flex items-center gap-1 text-sm font-semibold hover:underline disabled:opacity-50';
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => download(item)} className={`${linkClass} text-primary`}><Download size={14} />Download</button>
        {!showArchive && canEdit ? <button type="button" disabled={busy} onClick={() => setModal({ mode: 'edit', doc: item })} className={`${linkClass} text-slate-600`}><PencilLine size={14} />Edit</button> : null}
        {!showArchive && canManage ? <button type="button" disabled={busy} onClick={() => act(item, 'archive')} className={`${linkClass} text-slate-600`}><Archive size={14} />Archive</button> : null}
        {showArchive ? <button type="button" disabled={busy} onClick={() => act(item, 'restore')} className={`${linkClass} text-primary`}><RotateCcw size={14} />Restore</button> : null}
        {showArchive ? <button type="button" disabled={busy} onClick={() => act(item, 'delete')} className={`${linkClass} text-red-600`}><Trash2 size={14} />Delete</button> : null}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        label="Files"
        title="Storage Management"
        description="Private file cabinet with access tiers and logged downloads."
        actions={
          <>
            <Button variant="outline" onClick={load} className="gap-2"><RefreshCw size={15} />Refresh</Button>
            {canUpload ? <Button onClick={() => setModal({ mode: 'create', doc: null })} className="gap-2"><Plus size={15} />Upload</Button> : null}
          </>
        }
      />

      {error ? <p role="alert" className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="rounded-theme bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="input flex min-w-0 flex-1 items-center gap-2 lg:w-64">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input className="w-full border-0 bg-transparent p-0 outline-none focus:ring-0" placeholder="Search title or file name" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            {canManage ? (
              <Button variant={showArchive ? 'default' : 'outline'} onClick={() => setShowArchive((v) => !v)} className="shrink-0 gap-2">
                <Archive size={15} />{showArchive ? 'Back to active' : 'Archive'}
              </Button>
            ) : null}
          </div>
        </div>

        {showArchive ? <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Archived documents</p> : null}

        {loading ? (
          <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading documents">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-theme border border-slate-100 p-4">
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-theme border border-dashed border-slate-200 px-4 py-12 text-center">
            <FolderSearch size={28} className="text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">{empty}</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">Document</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Linked to</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Who can see it</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{showArchive ? 'Archived' : 'Uploaded'}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 break-all text-xs text-slate-500">{extLabel(item.originalName)} · {formatSize(item.size)} · {item.originalName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{item.associationName}</p>
                      <p className="text-xs text-slate-500">{item.associationType === 'employee' ? 'Employee' : 'Project'}</p>
                    </td>
                    <td className="px-4 py-4"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLES[item.accessTier] || TIER_STYLES.project_team}`}>{item.accessLabel}</span></td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{formatDate(showArchive ? item.archivedAt : item.createdAt)}</p>
                      <p className="text-xs text-slate-500">by {item.uploadedBy?.name || 'System'}</p>
                    </td>
                    <td className="px-4 py-4"><div className="flex justify-end"><Actions item={item} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal ? (
        <DocumentModal
          mode={modal.mode}
          doc={modal.doc}
          canManage={canManage}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      ) : null}
    </div>
  );
}
