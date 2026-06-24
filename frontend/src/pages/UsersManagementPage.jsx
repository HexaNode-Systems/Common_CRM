import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, PencilLine, X } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB').format(new Date(value));
}

function normalizeRoleLabel(role) {
  return String(role || '-').replaceAll('_', ' ').trim().toUpperCase() || '-';
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}

function StatusToggle({ active, disabled, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-slate-300'} ${disabled ? 'cursor-wait opacity-60' : 'hover:brightness-95'}`}
      aria-label={active ? 'Deactivate user' : 'Activate user'}
      title={active ? 'Deactivate user' : 'Activate user'}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function UserFormModal({ mode, user, roles, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.roleSlug || user?.role || '',
      password: '',
      isActive: typeof user?.isActive === 'boolean' ? user.isActive : true
    });
  }, [user]);

  const title = mode === 'create' ? 'Add New User' : `Edit User Details: ${user?.name || ''}`;
  const statusLabel = mode === 'create' ? 'Initial Status' : 'Account Status';
  const availableRoles = useMemo(() => {
    const currentRole = user?.roleSlug || user?.role;
    if (!currentRole || roles.some((role) => role.slug === currentRole)) return roles;
    return [{ _id: currentRole, slug: currentRole }, ...roles];
  }, [roles, user]);

  function submit(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close user form" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Manage login credentials, role access, and account state.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Full Name</span>
            <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="input" placeholder="JITENDRA KUMAR" />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">User ID / Email</span>
            <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="input" placeholder="user@example.com" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Role Selection</span>
            <select required value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="input">
              <option value="">Select role</option>
              {availableRoles.map((role) => (
                <option key={role._id} value={role.slug}>{normalizeRoleLabel(role.slug)}</option>
              ))}
            </select>
          </label>

          <div className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{statusLabel}</span>
            <div className="flex h-[42px] items-center gap-4 rounded-theme border border-slate-200 px-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="status" checked={form.isActive === true} onChange={() => setForm((current) => ({ ...current, isActive: true }))} className="h-4 w-4 accent-primary" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="status" checked={form.isActive === false} onChange={() => setForm((current) => ({ ...current, isActive: false }))} className="h-4 w-4 accent-primary" />
                Inactive
              </label>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password Assignment</span>
            <div className="flex items-center gap-2 rounded-theme border border-slate-200 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <input
                required={mode === 'create'}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="flex-1 border-0 bg-transparent px-0 py-2.5 outline-none focus:ring-0"
                placeholder={mode === 'create' ? 'Create a secure password' : 'Leave blank to keep the current password'}
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 transition hover:text-slate-900" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <Button disabled={saving} type="submit" className="px-4 py-2">
            {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [error, setError] = useState('');

  const activeRoles = useMemo(() => roles.filter((role) => role.isActive !== false), [roles]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/v1/users', { params: { limit: 100 } }),
        api.get('/v1/roles')
      ]);
      setUsers(usersRes.data.items || []);
      setRoles((rolesRes.data.items || []).filter((role) => role.isActive !== false));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setSelectedUser(null);
    setModalMode('create');
  }

  function openEdit(user) {
    setSelectedUser(user);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
  }

  async function saveUser(form) {
    setFormSaving(true);
    setError('');
    try {
      if (modalMode === 'create') {
        const { data } = await api.post('/v1/users', form);
        setUsers((current) => [data, ...current]);
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const { data } = await api.put(`/v1/users/${selectedUser._id}`, payload);
        setUsers((current) => current.map((item) => (item._id === data._id ? data : item)));
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save user.');
    } finally {
      setFormSaving(false);
    }
  }

  async function toggleStatus(user) {
    const nextActive = !user.isActive;
    const previousUsers = users;
    setSavingId(user._id);
    setUsers((current) => current.map((item) => (item._id === user._id ? { ...item, isActive: nextActive } : item)));

    try {
      const { data } = await api.patch(`/v1/users/${user._id}/status`, { isActive: nextActive });
      setUsers((current) => current.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setUsers(previousUsers);
      setError(err.response?.data?.message || 'Unable to update user status.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Users / Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Create login-enabled users, assign live roles, and control access instantly.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadData} className="inline-flex items-center gap-2 px-3 py-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2">
            <Plus size={16} />
            Add New
          </Button>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[920px] w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-3">Name / Title</th>
                <th className="px-3 py-3">Type / Status</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created Date</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-3 py-4" colSpan="5">Loading...</td></tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user._id} className="transition hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{user.name}</td>
                    <td className="px-3 py-3 text-slate-600">{normalizeRoleLabel(user.roleLabel || user.role)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <StatusBadge active={user.isActive} />
                        <StatusToggle active={user.isActive} disabled={savingId === user._id} onChange={() => toggleStatus(user)} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => openEdit(user)} className="inline-flex items-center gap-1 font-semibold text-primary transition hover:text-blue-700">
                        <PencilLine size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-3 py-4 text-slate-500" colSpan="5">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalMode ? (
        <UserFormModal
          mode={modalMode}
          user={selectedUser}
          roles={activeRoles}
          saving={formSaving}
          onClose={closeModal}
          onSave={saveUser}
        />
      ) : null}
    </div>
  );
}
