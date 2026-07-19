import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, Copy, X } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = {
  title: '',
  platformUrl: '',
  username: '',
  secret: '',
  accessGroups: []
};

function normalizeLabel(value) {
  return String(value || '').replaceAll('_', ' ').toUpperCase();
}

function VaultModal({ mode, credential, roles, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setForm({
      title: credential?.title || '',
      platformUrl: credential?.platformUrl || '',
      username: credential?.username || '',
      secret: '',
      accessGroups: credential?.accessGroups || []
    });
  }, [credential]);

  function submit(event) {
    event.preventDefault();
    onSave(form);
  }

  function toggleGroup(value) {
    setForm((current) => ({
      ...current,
      accessGroups: current.accessGroups.includes(value)
        ? current.accessGroups.filter((group) => group !== value)
        : [...current.accessGroups, value]
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close vault modal" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 flex w-full max-w-3xl max-h-[88vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{mode === 'create' ? 'Add New Credential' : `Edit Credential: ${credential?.title || ''}`}</h2>
            <p className="mt-1 text-sm text-slate-500">Store secrets encrypted and restrict access by role.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Account Title</span><input className="input" required value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Platform URL</span><input className="input" required value={form.platformUrl} onChange={(e) => setForm((current) => ({ ...current, platformUrl: e.target.value }))} placeholder="https://app.example.com" /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Username / Email ID</span><input className="input" required value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Password / Token Key</span><div className="flex items-center gap-2 rounded-theme border border-slate-200 px-3"><input className="flex-1 border-0 bg-transparent px-0 py-2.5 outline-none focus:ring-0" type={showSecret ? 'text' : 'password'} required={mode === 'create'} value={form.secret} onChange={(e) => setForm((current) => ({ ...current, secret: e.target.value }))} placeholder={mode === 'create' ? 'Enter secret' : 'Leave blank to keep current secret'} /><button type="button" onClick={() => setShowSecret((value) => !value)}>{showSecret ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Access Group Selection</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => (
                <label key={role.slug} className={`flex cursor-pointer items-center gap-2 rounded-theme border px-3 py-2 text-sm ${form.accessGroups.includes(role.slug) ? 'border-primary bg-blue-50' : 'border-slate-200'}`}>
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.accessGroups.includes(role.slug)} onChange={() => toggleGroup(role.slug)} />
                  <span>{normalizeLabel(role.slug)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <Button type="submit" disabled={saving} className="px-4 py-2">{saving ? 'Saving...' : mode === 'create' ? 'Create Credential' : 'Update Credential'}</Button>
        </div>
      </form>
    </div>
  );
}

function SecretCell({ credential, onReveal, onCopy, revealedSecret }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-slate-700">{revealedSecret || '••••••••'}</span>
      <button type="button" onClick={() => onReveal(credential)} className="text-slate-500 transition hover:text-primary" aria-label="Reveal secret"><Eye size={16} /></button>
      <button type="button" onClick={() => onCopy(revealedSecret || '••••••••')} className="text-slate-500 transition hover:text-primary" aria-label="Copy secret"><Copy size={16} /></button>
    </div>
  );
}

export default function VaultManagementPage() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [revealedSecrets, setRevealedSecrets] = useState({});

  const { user: currentUser } = useAuth();
  const activeRoles = useMemo(() => roles.filter((role) => role.slug), [roles]);

  const canCreate = useMemo(() => {
    return currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('vault:create');
  }, [currentUser]);

  const canUpdate = useMemo(() => {
    return currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('vault:update');
  }, [currentUser]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [vaultRes, roleRes] = await Promise.all([
        api.get('/v1/vault'),
        api.get('/v1/vault/roles')
      ]);
      setItems(vaultRes.data.items || []);
      setRoles(roleRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load credentials.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setModalMode('create');
  }

  function openEdit(credential) {
    setEditing(credential);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function saveCredential(form) {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.secret) delete payload.secret;
      const { data } = modalMode === 'create'
        ? await api.post('/v1/vault', payload)
        : await api.put(`/v1/vault/${editing._id}`, payload);
      setItems((current) => modalMode === 'create' ? [data, ...current] : current.map((item) => (item._id === data._id ? data : item)));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save credential.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(credential) {
    const nextActive = !credential.isActive;
    setItems((current) => current.map((item) => (item._id === credential._id ? { ...item, isActive: nextActive } : item)));
    try {
      const { data } = await api.patch(`/v1/vault/${credential._id}/status`, { isActive: nextActive });
      setItems((current) => current.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.');
      load();
    }
  }

  async function revealSecret(credential) {
    try {
      const { data } = await api.post(`/v1/vault/${credential._id}/reveal`);
      setRevealedSecrets((current) => ({ ...current, [credential._id]: data.secret }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reveal secret.');
    }
  }

  async function copySecret(secret) {
    await navigator.clipboard.writeText(secret);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vault / Credentials Management</h1>
          <p className="mt-1 text-sm text-slate-600">Encrypted credentials, role-restricted visibility, and reveal auditing.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} className="inline-flex items-center gap-2 px-4 py-2"><RefreshCw size={16} />Refresh</Button>
          {canCreate && (
            <Button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2"><Plus size={16} />Add New</Button>
          )}
        </div>
      </div>

      {error ? <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700">Resource Title & Meta-Tags</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Destination Target</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Security Masking</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Loading credentials...</td></tr> : items.map((credential) => (
                <tr key={credential._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{credential.title}</p>
                    <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{(credential.accessGroups || []).map(normalizeLabel).join(' / ') || 'Global'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <a href={credential.platformUrl} target="_blank" rel="noreferrer" className="block font-medium text-primary hover:underline">{credential.platformUrl}</a>
                    <p className="mt-1 text-xs text-slate-500">{credential.username}</p>
                  </td>
                  <td className="px-4 py-4"><SecretCell credential={credential} onReveal={revealSecret} onCopy={copySecret} revealedSecret={revealedSecrets[credential._id]} /></td>
                  <td className="px-4 py-4"><button type="button" disabled={!canUpdate} onClick={() => toggleStatus(credential)} className={`rounded-full px-3 py-1 text-xs font-semibold ${credential.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} disabled:opacity-75 disabled:cursor-not-allowed`}>{credential.isActive ? 'Active' : 'Suspended'}</button></td>
                  <td className="px-4 py-4 text-right">{canUpdate && <button type="button" onClick={() => openEdit(credential)} className="font-semibold text-primary hover:underline">Edit</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalMode ? <VaultModal mode={modalMode} credential={editing} roles={activeRoles} saving={saving} onClose={closeModal} onSave={saveCredential} /> : null}
    </div>
  );
}
