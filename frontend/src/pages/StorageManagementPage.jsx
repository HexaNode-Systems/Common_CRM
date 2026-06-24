import { useEffect, useMemo, useState } from 'react';
import { FileText, FolderSearch, Plus, RefreshCw, Upload, X, Download, Archive } from 'lucide-react';
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

function UploadModal({ onClose, onSave, saving, lookupEmployees, lookupProjects }) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const associationOptions = useMemo(() => (form.category === 'hr' ? lookupEmployees : lookupProjects), [form.category, lookupEmployees, lookupProjects]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close upload modal" />
      <form onSubmit={submit} className="relative z-10 flex w-full max-w-3xl max-h-[88vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload New Document</h2>
            <p className="mt-1 text-sm text-slate-500">Route files into secure categories with access controls.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Document Custom Title</span><input className="input" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Defaults to file name if blank" /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Primary Core Category</span><select className="input" value={form.category} onChange={(e) => updateField('category', e.target.value)}><option value="hr">HR</option><option value="client">Agreement</option><option value="project">Project Artifact</option><option value="finance">Invoice</option></select></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Association Linker</span><select className="input" value={form.associationId} onChange={(e) => updateField('associationId', e.target.value)}><option value="">Select associated entity</option>{associationOptions.map((item) => <option key={item._id} value={item._id}>{item.name || item.title}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Privacy Lock Setter</span><select className="input" value={form.accessTier} onChange={(e) => updateField('accessTier', e.target.value)}>{privacyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">File Input Dropzone</span><div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center"><Upload size={22} className="mx-auto text-slate-400" /><p className="mt-2 text-sm text-slate-600">Drag and drop or choose a file</p><input className="mt-3 w-full text-sm" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div></label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button><Button type="submit" disabled={saving} className="px-4 py-2">{saving ? 'Uploading...' : 'Upload Document'}</Button></div>
      </form>
    </div>
  );
}

export default function StorageManagementPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [storageRes, userRes, projectRes] = await Promise.all([
        api.get('/v1/storage', { params: activeTab === 'all' ? {} : { tab: activeTab } }),
        api.get('/v1/users', { params: { limit: 200 } }),
        api.get('/catalog', { params: { limit: 200 } })
      ]);
      setItems(storageRes.data.items || []);
      setEmployees((userRes.data.items || []).filter((user) => user.isActive));
      setProjects((projectRes.data.items || []).filter((project) => ['Pipeline', 'Running'].includes(project.projectStatus)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [activeTab]);

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

  async function downloadDocument(document) {
    const { data } = await api.get(`/v1/storage/${document._id}/download-link`);
    window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
  }

  async function archiveDocument(document) {
    await api.patch(`/v1/storage/${document._id}/archive`);
    load();
  }

  const visibleItems = useMemo(() => items.filter((item) => activeTab === 'all' ? true : item.category === categoryMap[activeTab]), [items, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Storage Management</h1>
          <p className="mt-1 text-sm text-slate-600">Private file cabinet with access tiers and controlled downloads.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} className="inline-flex items-center gap-2 px-4 py-2"><RefreshCw size={16} />Refresh</Button>
          <Button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-2 px-4 py-2"><Plus size={16} />Add New</Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700">Document Metadata</th>
                <th className="px-4 py-3 font-semibold text-slate-700">File Owner / Association</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Security & Access Level</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Upload Timeline</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="5">Loading documents...</td></tr> : visibleItems.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{extLabel(item.originalName)}</p></td>
                  <td className="px-4 py-4"><p className="font-medium text-slate-900">{item.associationName || 'Associated Entity'}</p><p className="text-xs text-slate-500">{item.originalName}</p></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.accessLabel}</span></td>
                  <td className="px-4 py-4"><p className="font-medium text-slate-700">Uploaded On {formatDate(item.createdAt)}</p><p className="text-xs text-slate-500">Uploaded By {item.uploadedBy?.name || 'System'}</p></td>
                  <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => downloadDocument(item)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><Download size={14} />Download</button><button type="button" onClick={() => archiveDocument(item)} className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:underline"><Archive size={14} />Archive</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {uploadOpen ? <UploadModal onClose={() => setUploadOpen(false)} onSave={saveDocument} saving={saving} lookupEmployees={employees} lookupProjects={projects} /> : null}
    </div>
  );
}
