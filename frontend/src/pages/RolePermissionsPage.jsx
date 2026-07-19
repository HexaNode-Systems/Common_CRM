import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, X, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB').format(new Date(value));
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function StatusToggle({ role, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(role)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${role.isActive ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-slate-300'} ${disabled ? 'cursor-wait opacity-70' : 'hover:brightness-95'}`}
      aria-label={`Set ${role.name} ${role.isActive ? 'inactive' : 'active'}`}
      title={`Set ${role.name} ${role.isActive ? 'inactive' : 'active'}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${role.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function PermissionDrawer({ role, saving, onClose, onSave }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!role) return;
    setLoading(true);
    setError('');
    api.get(`/v1/roles/${role._id}/permissions`)
      .then((res) => {
        setPermissions(res.data.permissions || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load permissions.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [role]);

  if (!role) return null;

  function setAccess(moduleId, permissionValue) {
    setPermissions((current) =>
      current.map((p) =>
        p.moduleId === moduleId ? { ...p, permission: permissionValue } : p
      )
    );
  }

  const ACCESS_OPTIONS = [
    { value: 0, label: 'No Access' },
    { value: 1, label: 'View Only' },
    { value: 2, label: 'Update Only' },
    { value: 3, label: 'Full Access' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close permissions drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">Edit Permissions - {role.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Assign one access level per module.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close" title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {loading ? (
            <div className="py-8 text-center text-slate-500 font-medium">Loading permissions...</div>
          ) : (
            <div className="overflow-x-auto rounded-theme border border-slate-200">
              <table className="min-w-[680px] w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-3 font-semibold">Module Name</th>
                    {ACCESS_OPTIONS.map((option) => (
                      <th key={option.value} className="px-4 py-3 text-center font-semibold">{option.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.map((p) => (
                    <tr key={p.moduleId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.displayName}</td>
                      {ACCESS_OPTIONS.map((option) => (
                        <td key={option.value} className="px-4 py-3 text-center">
                          <input
                            type="radio"
                            name={`permission-${p.moduleId}`}
                            value={option.value}
                            checked={p.permission === option.value}
                            disabled={role.slug === 'super_admin'}
                            onChange={() => setAccess(p.moduleId, option.value)}
                            className="h-4 w-4 accent-primary"
                            aria-label={`${p.displayName} ${option.label}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <Button disabled={saving || loading || role.slug === 'super_admin'} onClick={() => onSave(role._id, permissions)} className="px-4 py-2">
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </aside>
    </div>
  );
}

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/v1/roles');
      setRoles(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load roles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(role) {
    const nextActive = !role.isActive;
    const previousRoles = roles;
    setStatusSavingId(role._id);
    setError('');
    setRoles((current) => current.map((item) => (
      item._id === role._id ? { ...item, isActive: nextActive } : item
    )));

    try {
      const { data } = await api.patch(`/v1/roles/${role._id}/status`, { isActive: nextActive });
      setRoles((current) => current.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setRoles(previousRoles);
      const message = err.response?.data?.message || 'Unable to update role status.';
      setError(message);
      window.alert(message);
    } finally {
      setStatusSavingId(null);
    }
  }

  async function createRole() {
    const name = window.prompt('Role name');
    if (!name?.trim()) return;

    setCreatingRole(true);
    setError('');
    try {
      const { data } = await api.post('/v1/roles', { name: name.trim() });
      setRoles((current) => [data, ...current]);
      setEditingRole(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to create role.';
      setError(message);
      window.alert(message);
    } finally {
      setCreatingRole(false);
    }
  }

  async function savePermissions(roleId, permissions) {
    setDrawerSaving(true);
    setError('');
    try {
      await api.put(`/v1/roles/${roleId}/permissions`, {
        permissions: permissions
      });
      setEditingRole(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save permissions.');
    } finally {
      setDrawerSaving(false);
    }
  }

  async function deleteRole(role) {
    if (role.slug === 'super_admin' || role.isSystem) {
      window.alert('System roles (including Super Admin) cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this role?\nThis action cannot be undone.'
    );
    if (!confirmed) return;

    setDeletingRoleId(role._id);
    setError('');
    try {
      await api.delete(`/v1/roles/${role._id}`);
      setRoles((current) => current.filter((item) => item._id !== role._id));
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to delete role.';
      setError(message);
      window.alert(message);
    } finally {
      setDeletingRoleId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Role & Permission Management</h1>
          <p className="mt-1 text-sm text-slate-500">Configure role status, access policies, and permission vectors.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={load} className="inline-flex items-center gap-2 px-3 py-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button onClick={createRole} disabled={creatingRole} className="inline-flex items-center gap-2 px-3 py-2">
            <Plus size={16} />
            {creatingRole ? 'Adding...' : 'Add New'}
          </Button>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[760px] w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-3">Role Name</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created Date</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-3 py-4" colSpan="4">Loading...</td></tr>
              ) : roles.length ? (
                roles.map((role) => (
                  <tr key={role._id} className="transition hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{role.name}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <StatusBadge active={role.isActive} />
                        <StatusToggle role={role} disabled={statusSavingId === role._id} onToggle={toggleStatus} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(role.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setEditingRole(role)} className="font-semibold text-primary transition hover:underline">
                          Edit
                        </button>
                        {!(role.slug === 'super_admin' || role.isSystem) && (
                          <button
                            type="button"
                            disabled={deletingRoleId === role._id}
                            onClick={() => deleteRole(role)}
                            className="inline-flex items-center gap-1 font-semibold text-red-600 transition hover:underline disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-3 py-4" colSpan="4">No roles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PermissionDrawer
        role={editingRole}
        saving={drawerSaving}
        onClose={() => setEditingRole(null)}
        onSave={savePermissions}
      />
    </div>
  );
}
