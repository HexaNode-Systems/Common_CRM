import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, Copy, Check, X } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SECRET_VISIBLE_MS = 30_000; // revealed secrets hide again after 30 seconds
const MASK = '••••••••';

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

// Only allow normal web links. This blocks "javascript:" links saved by mistake or on purpose.
function safeHref(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

/* ---------- Small reusable pieces ---------- */

function PlatformLink({ url }) {
  const href = safeHref(url);
  if (!href) return <span className="block break-all font-medium text-slate-700">{url}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block break-all font-medium text-primary hover:underline">
      {url}
    </a>
  );
}

function GroupBadge({ groups }) {
  return (
    <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      <span className="truncate">{(groups || []).map(normalizeLabel).join(' / ') || 'Global'}</span>
    </span>
  );
}

function SecretCell({ credential, revealedSecret, revealing, copied, onToggle, onCopy }) {
  const revealed = Boolean(revealedSecret);
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 break-all font-mono text-slate-700">{revealedSecret || MASK}</span>
      <button
        type="button"
        disabled={revealing}
        onClick={() => onToggle(credential)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-primary disabled:opacity-50 md:h-8 md:w-8"
        aria-label={revealed ? `Hide secret for ${credential.title}` : `Reveal secret for ${credential.title}`}
      >
        {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        type="button"
        disabled={revealing}
        onClick={() => onCopy(credential)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-primary disabled:opacity-50 md:h-8 md:w-8"
        aria-label={`Copy secret for ${credential.title}`}
      >
        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function StatusButton({ credential, canUpdate, onToggle }) {
  return (
    <button
      type="button"
      disabled={!canUpdate}
      onClick={() => onToggle(credential)}
      aria-label={`${credential.title} is ${credential.isActive ? 'active' : 'suspended'}${canUpdate ? '. Change status' : ''}`}
      className={`min-h-[36px] rounded-full px-3 py-1 text-xs font-semibold ${credential.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} disabled:cursor-not-allowed disabled:opacity-75`}
    >
      {credential.isActive ? 'Active' : 'Suspended'}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-3" aria-busy="true" aria-label="Loading credentials">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-100 p-4">
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Add / edit dialog ---------- */

function VaultModal({ mode, credential, roles, rolesLoading, saving, onClose, onSave }) {
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
    // Bottom sheet on phones, centered dialog on larger screens
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close vault modal" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-slate-900">{mode === 'create' ? 'Add New Credential' : `Edit Credential: ${credential?.title || ''}`}</h2>
            <p className="mt-1 text-sm text-slate-500">Store secrets encrypted and restrict access by role.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Account Title</span>
            <input className="input" required value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Platform URL</span>
            <input className="input" required value={form.platformUrl} onChange={(e) => setForm((current) => ({ ...current, platformUrl: e.target.value }))} placeholder="https://app.example.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Username / Email ID</span>
            <input className="input" required value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} />
          </label>

          <div>
            <label htmlFor="vault-secret" className="mb-1 block text-sm font-medium text-slate-700">Password / Token Key</label>
            <div className="flex items-center gap-2 rounded-theme border border-slate-200 px-3 focus-within:border-slate-400">
              <input
                id="vault-secret"
                className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 outline-none focus:ring-0"
                type={showSecret ? 'text' : 'password'}
                autoComplete="new-password"
                required={mode === 'create'}
                value={form.secret}
                onChange={(e) => setForm((current) => ({ ...current, secret: e.target.value }))}
                placeholder={mode === 'create' ? 'Enter secret' : 'Leave blank to keep current secret'}
              />
              <button
                type="button"
                onClick={() => setShowSecret((value) => !value)}
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                aria-pressed={showSecret}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-slate-500"
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">Access Group Selection</legend>
            {rolesLoading && roles.length === 0 ? (
              <p className="text-sm text-slate-500">Loading roles...</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.slug} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-theme border px-3 py-2 text-sm ${form.accessGroups.includes(role.slug) ? 'border-primary bg-blue-50' : 'border-slate-200'}`}>
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.accessGroups.includes(role.slug)} onChange={() => toggleGroup(role.slug)} />
                    <span className="break-words">{normalizeLabel(role.slug)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <Button type="submit" disabled={saving} className="px-4 py-2.5">{saving ? 'Saving...' : mode === 'create' ? 'Create Credential' : 'Update Credential'}</Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Page ---------- */

export default function VaultManagementPage() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [revealingId, setRevealingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const rolesLoaded = useRef(false);
  const hideTimers = useRef({});
  const copyTimer = useRef(null);
  const requestId = useRef(0);

  const { user: currentUser } = useAuth();
  const activeRoles = useMemo(() => roles.filter((role) => role.slug), [roles]);

  const canCreate = useMemo(
    () => currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('vault:create'),
    [currentUser]
  );
  const canUpdate = useMemo(
    () => currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('vault:update'),
    [currentUser]
  );

  // Load ONLY the credentials list. This is what the user sees first.
  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/v1/vault');
      if (current !== requestId.current) return;
      setItems(data.items || []);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(err.response?.data?.message || 'Unable to load credentials.');
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, []);

  // Roles are only needed inside the dialog, so they load the first time it opens.
  const loadRoles = useCallback(async () => {
    if (rolesLoaded.current) return;
    rolesLoaded.current = true;
    setRolesLoading(true);
    try {
      const { data } = await api.get('/v1/vault/roles');
      setRoles(data.items || []);
    } catch (err) {
      rolesLoaded.current = false; // allow a retry
      setError(err.response?.data?.message || 'Unable to load roles.');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // When leaving the page, clear timers and forget any revealed secrets
  useEffect(() => () => {
    Object.values(hideTimers.current).forEach(clearTimeout);
    clearTimeout(copyTimer.current);
  }, []);

  function openCreate() {
    setEditing(null);
    setModalMode('create');
    loadRoles();
  }

  function openEdit(credential) {
    setEditing(credential);
    setModalMode('edit');
    loadRoles();
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
      setItems((current) => (modalMode === 'create' ? [data, ...current] : current.map((item) => (item._id === data._id ? data : item))));
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

  function hideSecret(id) {
    clearTimeout(hideTimers.current[id]);
    setRevealedSecrets((current) => {
      const { [id]: removed, ...rest } = current;
      return rest;
    });
  }

  // Returns the secret. If it is not revealed yet, asks the server (this is the audited call).
  async function ensureSecret(credential) {
    const existing = revealedSecrets[credential._id];
    if (existing) return existing;
    setRevealingId(credential._id);
    setError('');
    try {
      const { data } = await api.post(`/v1/vault/${credential._id}/reveal`);
      setRevealedSecrets((current) => ({ ...current, [credential._id]: data.secret }));
      // Hide it again after 30 seconds
      clearTimeout(hideTimers.current[credential._id]);
      hideTimers.current[credential._id] = setTimeout(() => hideSecret(credential._id), SECRET_VISIBLE_MS);
      return data.secret;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reveal secret.');
      return null;
    } finally {
      setRevealingId(null);
    }
  }

  async function toggleReveal(credential) {
    if (revealedSecrets[credential._id]) hideSecret(credential._id);
    else await ensureSecret(credential);
  }

  // FIX: before, the copy button copied "••••••••" if the secret was not revealed yet
  async function copySecret(credential) {
    const secret = await ensureSecret(credential);
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedId(credential._id);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Unable to copy automatically. The secret is now visible, so you can copy it by hand.');
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Vault / Credentials Management</h1>
          <p className="mt-1 text-sm text-slate-600">Encrypted credentials, role-restricted visibility, and reveal auditing.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button onClick={load} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 sm:flex-none"><RefreshCw size={16} />Refresh</Button>
          {canCreate && (
            <Button onClick={openCreate} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 sm:flex-none"><Plus size={16} />Add New</Button>
          )}
        </div>
      </div>

      {error ? <p role="alert" className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        {loading ? <LoadingSkeleton /> : null}

        {!loading && items.length === 0 && !error ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500">No credentials saved yet.</p>
        ) : null}

        {/* Phones and small tablets: one card per credential */}
        {!loading && items.length > 0 ? (
          <ul className="space-y-3 p-3 md:hidden">
            {items.map((credential) => (
              <li key={credential._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words font-semibold text-slate-900">{credential.title}</p>
                  <StatusButton credential={credential} canUpdate={canUpdate} onToggle={toggleStatus} />
                </div>
                <div className="mt-2"><GroupBadge groups={credential.accessGroups} /></div>

                <div className="mt-3 space-y-1 text-sm">
                  <PlatformLink url={credential.platformUrl} />
                  <p className="break-all text-xs text-slate-500">{credential.username}</p>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-1 text-xs font-medium text-slate-500">Secret</p>
                  <SecretCell
                    credential={credential}
                    revealedSecret={revealedSecrets[credential._id]}
                    revealing={revealingId === credential._id}
                    copied={copiedId === credential._id}
                    onToggle={toggleReveal}
                    onCopy={copySecret}
                  />
                </div>

                {canUpdate ? (
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => openEdit(credential)} className="min-h-[40px] rounded-theme px-3 text-sm font-semibold text-primary hover:bg-slate-50">Edit</button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Tablets and desktops: full table (no fixed 1080px width) */}
        {!loading && items.length > 0 ? (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Resource Title & Meta-Tags</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Destination Target</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Security Masking</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((credential) => (
                  <tr key={credential._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{credential.title}</p>
                      <div className="mt-2"><GroupBadge groups={credential.accessGroups} /></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[260px]"><PlatformLink url={credential.platformUrl} /></div>
                      <p className="mt-1 break-all text-xs text-slate-500">{credential.username}</p>
                    </td>
                    <td className="px-4 py-4">
                      <SecretCell
                        credential={credential}
                        revealedSecret={revealedSecrets[credential._id]}
                        revealing={revealingId === credential._id}
                        copied={copiedId === credential._id}
                        onToggle={toggleReveal}
                        onCopy={copySecret}
                      />
                    </td>
                    <td className="px-4 py-4"><StatusButton credential={credential} canUpdate={canUpdate} onToggle={toggleStatus} /></td>
                    <td className="px-4 py-4 text-right">
                      {canUpdate && <button type="button" onClick={() => openEdit(credential)} className="font-semibold text-primary hover:underline">Edit</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      {modalMode ? (
        <VaultModal
          mode={modalMode}
          credential={editing}
          roles={activeRoles}
          rolesLoading={rolesLoading}
          saving={saving}
          onClose={closeModal}
          onSave={saveCredential}
        />
      ) : null}
    </div>
  );
}