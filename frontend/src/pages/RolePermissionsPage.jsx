import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, X, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';

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

function StatusToggle({ role, disabled, onToggle, lockedReason }) {
  return (
    <button
      type="button"
      disabled={disabled || Boolean(lockedReason)}
      onClick={() => onToggle(role)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${role.isActive ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-slate-300'} ${lockedReason ? 'cursor-not-allowed opacity-50' : disabled ? 'cursor-wait opacity-70' : 'hover:brightness-95'}`}
      aria-label={lockedReason || `Set ${role.name} ${role.isActive ? 'inactive' : 'active'}`}
      title={lockedReason || `Set ${role.name} ${role.isActive ? 'inactive' : 'active'}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${role.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function PermissionDrawer({ role, saving, saveError, canManage, isOwnRole, onClose, onSave }) {
  const [permissions, setPermissions] = useState([]);
  const [original, setOriginal] = useState([]);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!role) return;
    setLoading(true);
    setError('');
    api.get(`/v1/roles/${role._id}/permissions`)
      .then((res) => {
        setPermissions(res.data.permissions || []);
        setOriginal(res.data.permissions || []);
        setEditable(res.data.editable !== false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load permissions.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [role]);

  const changedCount = useMemo(() => {
    const before = new Map(original.map((p) => [String(p.moduleId), p.permission]));
    return permissions.filter((p) => before.get(String(p.moduleId)) !== p.permission).length;
  }, [permissions, original]);

  if (!role) return null;

  const readOnly = !canManage || !editable || role.slug === 'super_admin' || isOwnRole;
  const readOnlyReason = role.slug === 'super_admin'
    ? 'Super Admin always has Full Access to everything.'
    : isOwnRole
      ? 'This is your own role. Ask a Super Admin to change it.'
      : !canManage
        ? 'You can view permissions but not change them.'
        : '';

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
          {error || saveError ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error || saveError}</p> : null}
          {readOnlyReason ? <p className="mb-4 rounded-theme bg-slate-50 px-3 py-2 text-sm text-slate-600">{readOnlyReason}</p> : null}
          {!readOnly ? (
            <p className="mb-4 text-xs text-slate-500">
              People with this role are signed out after you save, so they get the new access on their next sign-in.
              Options above your own access level are disabled.
            </p>
          ) : null}
          {loading ? (
            <Loader label="Loading permissions" />
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
                            disabled={readOnly || (option.value > (p.maxGrant ?? 3) && option.value !== p.permission)}
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
          {!readOnly ? (
            <Button disabled={saving || loading || changedCount === 0} onClick={() => onSave(role._id, permissions)} className="px-4 py-2">
              {saving ? 'Saving...' : changedCount ? `Save ${changedCount} change${changedCount === 1 ? '' : 's'}` : 'No changes'}
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default function RolePermissionsPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'roles', 'update');
  const [roles, setRoles] = useState([]);
  const [drawerError, setDrawerError] = useState('');
  const [notice, setNotice] = useState('');
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
      setError(err.response?.data?.message || 'Unable to update role status.');
    } finally {
      setStatusSavingId(null);
    }
  }

  async function createRole() {
    const name = window.prompt('Role name');
    if (!name?.trim()) return;

    setCreatingRole(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post('/v1/roles', { name: name.trim() });
      setRoles((current) => [data, ...current.filter((item) => item._id !== data._id)]);
      setDrawerError('');
      setEditingRole(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create role.');
    } finally {
      setCreatingRole(false);
    }
  }

  async function savePermissions(roleId, permissions) {
    setDrawerSaving(true);
    setDrawerError('');
    setNotice('');
    try {
      const { data } = await api.put(`/v1/roles/${roleId}/permissions`, {
        permissions: permissions.map((p) => ({ moduleId: p.moduleId, permission: p.permission }))
      });
      setEditingRole(null);
      if (data?.changed) setNotice(`Saved ${data.changed} change${data.changed === 1 ? '' : 's'}. People with this role will sign in again to get them.`);
      load();
    } catch (err) {
      // Shown inside the drawer, where the person is looking.
      setDrawerError(err.response?.data?.message || 'Unable to save permissions.');
    } finally {
      setDrawerSaving(false);
    }
  }

  async function deleteRole(role) {
    if (role.slug === 'super_admin' || role.isSystem) {
      setError('System roles (including Super Admin) cannot be deleted.');
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
      setError(err.response?.data?.message || 'Unable to delete role.');
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
          {canManage ? (
            <Button onClick={createRole} disabled={creatingRole} className="inline-flex items-center gap-2 px-3 py-2">
              <Plus size={16} />
              {creatingRole ? 'Adding...' : 'Add New'}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
      {notice ? <p className="mb-4 rounded-theme bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

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
                <tr><td colSpan="4"><Loader label="Loading roles" /></td></tr>
              ) : roles.length ? (
                roles.map((role) => {
                  const own = user?.role !== 'super_admin' && user?.role === role.slug;
                  const lockedReason = !canManage
                    ? 'You can view roles but not change them'
                    : role.isSystem || role.slug === 'super_admin'
                      ? 'System roles are always active'
                      : own
                        ? 'You cannot switch off your own role'
                        : '';
                  return (
                  <tr key={role._id} className="transition hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {role.name}
                      {own ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Your role</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <StatusBadge active={role.isActive} />
                        <StatusToggle role={role} disabled={statusSavingId === role._id} lockedReason={lockedReason} onToggle={toggleStatus} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(role.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => { setDrawerError(''); setEditingRole(role); }} className="font-semibold text-primary transition hover:underline">
                          {canManage && !own && role.slug !== 'super_admin' ? 'Edit' : 'View'}
                        </button>
                        {canManage && !own && !(role.slug === 'super_admin' || role.isSystem) && (
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
                  );
                })
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
        saveError={drawerError}
        canManage={canManage}
        isOwnRole={Boolean(editingRole) && user?.role !== 'super_admin' && user?.role === editingRole?.slug}
        onClose={() => setEditingRole(null)}
        onSave={savePermissions}
      />
    </div>
  );
}
