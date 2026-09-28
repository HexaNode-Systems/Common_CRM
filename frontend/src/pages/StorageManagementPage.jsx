import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FolderSearch, Plus, RefreshCw, Upload, X, Download, Archive } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const tabs = [
  { key: 'all', label: 'All Documents' },
  { key: 'hr', label: 'HR & Personnel' },
  { key: 'client', label: 'Client Agreements' },
  { key: 'project', label: 'Project Scope Artifacts' },
  { key: 'finance', label: 'Financial Documents' }
];

const categoryMap = {
  hr: 'hr',
  client: 'agreement',
  project: 'project',
  finance: 'invoice'
};

const privacyOptions = [
  { value: 'super_admin', label: 'Tier 1: Super Admin Only' },
  { value: 'hr_management', label: 'Tier 2: HR & Management' },
  { value: 'project_team', label: 'Tier 3: Project Team Collaborative' }
];

const emptyForm = {
  title: '',
  category: 'hr',
  associationType: 'employee',
  associationId: '',
  accessTier: 'project_team'
};

function associationTypeForCategory(category) {
  return category === 'hr' ? 'employee' : 'project';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB').format(new Date(value));
}

function extLabel(name = '') {
  const ext = String(name).split('.').pop().toUpperCase();
  return ext || 'FILE';
}

/* ---------- Small reusable pieces ---------- */

// Buttons for one document (used in both the table and the mobile card)
function DocActions({ item, busy, onDownload, onArchive }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onDownload(item)}
        className="inline-flex min-h-[40px] items-center gap-1 rounded-theme px-3 text-sm font-semibold text-primary hover:bg-slate-50 md:min-h-0 md:px-0 md:hover:bg-transparent md:hover:underline"
      >
        <Download size={14} />Download
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onArchive(item)}
        className="inline-flex min-h-[40px] items-center gap-1 rounded-theme px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 md:min-h-0 md:px-0 md:hover:bg-transparent md:hover:underline"
      >
        <Archive size={14} />{busy ? 'Archiving...' : 'Archive'}
      </button>
    </div>
  );
}

function AccessBadge({ label }) {
  return <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{label}</span>;
}

// Placeholder shown while the list loads. It keeps the layout stable and looks faster than plain text.
function LoadingSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading documents">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-100 p-4">
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center">
      <FolderSearch size={28} className="text-slate-400" />
      <p className="mt-3 font-semibold text-slate-800">No documents here yet</p>
      <p className="mt-1 text-sm text-slate-500">Upload a document to see it in this list.</p>
      <Button onClick={onAdd} className="mt-4 inline-flex items-center gap-2 px-4 py-2"><Plus size={16} />Add New</Button>
    </div>
  );
}

/* ---------- Upload modal ---------- */

function UploadModal({ onClose, onSave, saving, lookupEmployees, lookupProjects, lookupsLoading }) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const associationOptions = useMemo(
    () => (form.category === 'hr' ? lookupEmployees : lookupProjects),
    [form.category, lookupEmployees, lookupProjects]
  );

  function updateField(field, value) {
    setForm((current) => {
      if (field === 'category') {
        return {
          ...current,
          category: value,
          associationType: associationTypeForCategory(value),
          associationId: ''
        };
      }
      return { ...current, [field]: value };
    });
  }

  function submit(event) {
    event.preventDefault();
    if (!file) {
      setError('Select a file to upload.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File size cannot exceed 25MB.');
      return;
    }
    if (/\.(exe|bat)$/i.test(file.name)) {
      setError('Executable files are blocked.');
      return;
    }
    const payload = new FormData();
    payload.append('file', file);
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    onSave(payload);
  }

  return (
    // On phones the modal slides up from the bottom. On larger screens it is centered.
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close upload modal" />
      <form
        onSubmit={submit}
        className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Upload New Document</h2>
            <p className="mt-1 text-sm text-slate-500">Route files into secure categories with access controls.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Document Custom Title</span>
            <input className="input" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Defaults to file name if blank" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Primary Core Category</span>
              <select className="input" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                <option value="hr">HR</option>
                <option value="client">Agreement</option>
                <option value="project">Project Artifact</option>
                <option value="finance">Invoice</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Privacy Lock Setter</span>
              <select className="input" value={form.accessTier} onChange={(e) => updateField('accessTier', e.target.value)}>
                {privacyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Association Linker</span>
            <select className="input" value={form.associationId} onChange={(e) => updateField('associationId', e.target.value)} disabled={lookupsLoading}>
              <option value="">{lookupsLoading ? 'Loading options...' : 'Select associated entity'}</option>
              {associationOptions.map((item) => <option key={item._id} value={item._id}>{item.name || item.title}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">File Input Dropzone</span>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center sm:p-5">
              <Upload size={22} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">Choose a file to upload</p>
              <input className="mt-3 w-full text-sm" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? <p className="mt-2 break-all text-xs text-slate-500">{file.name}</p> : null}
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <Button type="submit" disabled={saving} className="px-4 py-2.5">{saving ? 'Uploading...' : 'Upload Document'}</Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Page ---------- */

export default function StorageManagementPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  // Used to ignore old responses when the user switches tabs quickly
  const requestId = useRef(0);
  // Employees and projects only need to be loaded once
  const lookupsLoaded = useRef(false);

  // Load ONLY the document list. This is what the user sees first.
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/v1/storage', {
        params: activeTab === 'all' ? {} : { tab: activeTab }
      });
      if (currentRequest !== requestId.current) return; // a newer request started, ignore this one
      setItems(data.items || []);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(err.response?.data?.message || 'Unable to load documents.');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  // Employees and projects are only needed inside the upload form,
  // so we load them the first time the form opens (not on page load).
  async function loadLookups() {
    if (lookupsLoaded.current) return;
    lookupsLoaded.current = true;
    setLookupsLoading(true);
    try {
      const [userRes, projectRes] = await Promise.all([
        api.get('/v1/users', { params: { limit: 200 } }),
        api.get('/catalog', { params: { limit: 200 } })
      ]);
      setEmployees((userRes.data.items || []).filter((user) => user.isActive));
      setProjects((projectRes.data.items || []).filter((project) => ['Pipeline', 'Running'].includes(project.projectStatus)));
    } catch (err) {
      lookupsLoaded.current = false; // allow a retry next time the form opens
      setError(err.response?.data?.message || 'Unable to load employees and projects.');
    } finally {
      setLookupsLoading(false);
    }
  }

  function openUpload() {
    setUploadOpen(true);
    loadLookups();
  }

  async function saveDocument(payload) {
    setSaving(true);
    setError('');
    try {
      await api.post('/v1/storage', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload document.');
    } finally {
      setSaving(false);
    }
  }

  async function downloadDocument(doc) {
    setError('');
    // Open the tab right away (on a tap). Phones block pop-ups that open after a network call.
    const win = window.open('', '_blank');
    try {
      const { data } = await api.get(`/v1/storage/${doc._id}/download-link`);
      if (win) {
        win.opener = null;
        win.location.href = data.downloadUrl;
      } else {
        window.location.assign(data.downloadUrl);
      }
    } catch (err) {
      if (win) win.close();
      setError(err.response?.data?.message || 'Unable to download document.');
    }
  }

  async function archiveDocument(doc) {
    if (!window.confirm(`Archive "${doc.title}"?`)) return;
    setArchivingId(doc._id);
    setError('');
    try {
      await api.patch(`/v1/storage/${doc._id}/archive`);
      // Remove it from the list right away instead of reloading everything
      setItems((current) => current.filter((item) => item._id !== doc._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to archive document.');
    } finally {
      setArchivingId(null);
    }
  }

  const visibleItems = useMemo(
    () => items.filter((item) => (activeTab === 'all' ? true : item.category === categoryMap[activeTab])),
    [items, activeTab]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header: stacks on phones, sits in one row on larger screens */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Storage Management</h1>
          <p className="mt-1 text-sm text-slate-600">Private file cabinet with access tiers and controlled downloads.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button onClick={load} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 sm:flex-none"><RefreshCw size={16} />Refresh</Button>
          <Button onClick={openUpload} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 sm:flex-none"><Plus size={16} />Add New</Button>
        </div>
      </div>

      {error ? <p role="alert" className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        {/* Tabs scroll sideways on small screens instead of wrapping into many rows */}
        <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-slate-200 px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSkeleton /> : null}

        {!loading && visibleItems.length === 0 ? <EmptyState onAdd={openUpload} /> : null}

        {/* Phones and small tablets: one card per document */}
        {!loading && visibleItems.length > 0 ? (
          <ul className="mt-4 space-y-3 md:hidden">
            {visibleItems.map((item) => (
              <li key={item._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 break-all text-xs text-slate-500">{item.originalName}</p>
                  </div>
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{extLabel(item.originalName)}</span>
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Linked to</dt>
                    <dd className="text-right font-medium text-slate-900">{item.associationName || 'Associated Entity'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Access</dt>
                    <dd><AccessBadge label={item.accessLabel} /></dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Uploaded</dt>
                    <dd className="text-right text-slate-700">{formatDate(item.createdAt)} by {item.uploadedBy?.name || 'System'}</dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-slate-100 pt-2">
                  <DocActions item={item} busy={archivingId === item._id} onDownload={downloadDocument} onArchive={archiveDocument} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Tablets and desktops: full table (no fixed 1100px width, so it fits smaller laptops) */}
        {!loading && visibleItems.length > 0 ? (
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">Document Metadata</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">File Owner / Association</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Security & Access Level</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-700 lg:table-cell">Upload Timeline</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{extLabel(item.originalName)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{item.associationName || 'Associated Entity'}</p>
                      <p className="max-w-[220px] break-all text-xs text-slate-500">{item.originalName}</p>
                    </td>
                    <td className="px-4 py-4"><AccessBadge label={item.accessLabel} /></td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <p className="font-medium text-slate-700">Uploaded On {formatDate(item.createdAt)}</p>
                      <p className="text-xs text-slate-500">Uploaded By {item.uploadedBy?.name || 'System'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <DocActions item={item} busy={archivingId === item._id} onDownload={downloadDocument} onArchive={archiveDocument} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      {uploadOpen ? (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSave={saveDocument}
          saving={saving}
          lookupEmployees={employees}
          lookupProjects={projects}
          lookupsLoading={lookupsLoading}
        />
      ) : null}
    </div>
  );
}