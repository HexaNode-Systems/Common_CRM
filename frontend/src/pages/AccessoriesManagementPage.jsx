import { useEffect, useState, useMemo } from 'react';
import { 
  Laptop, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  RefreshCw, 
  Smartphone, 
  Calendar, 
  User as UserIcon, 
  FileText 
} from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const emptyForm = {
  name: '',
  modelNumber: '',
  serialNumber: '',
  employee: '',
  assignmentDate: '',
  status: 'available',
  notes: ''
};

function AccessoryModal({ mode, accessory, users, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (accessory) {
      setForm({
        name: accessory.name || '',
        modelNumber: accessory.modelNumber || '',
        serialNumber: accessory.serialNumber || '',
        employee: accessory.employee?._id || accessory.employee || '',
        assignmentDate: accessory.assignmentDate ? new Date(accessory.assignmentDate).toISOString().split('T')[0] : '',
        status: accessory.status || 'available',
        notes: accessory.notes || ''
      });
    } else {
      setForm(emptyForm);
    }
  }, [accessory, mode]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <button 
        type="button" 
        className="absolute inset-0 cursor-default" 
        aria-label="Close modal" 
        onClick={onClose} 
      />
      <form 
        onSubmit={handleSubmit} 
        className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Laptop size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'create' ? 'Add Accessory / Asset' : 'Edit Accessory Details'}
              </h2>
              <p className="text-xs text-slate-500">Record serial numbers, SIM cards, models, and assign them to employees.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Asset Name */}
          <div>
            <label htmlFor="accessory-name" className="block text-sm font-semibold text-slate-700 mb-1">
              Accessory / Asset Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="accessory-name"
              type="text" 
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              placeholder="e.g. MacBook Pro, Jio SIM Card, Dell Keyboard"
              required 
              value={form.name} 
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} 
            />
          </div>

          {/* Grid for Model & Serial */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="accessory-model" className="block text-sm font-semibold text-slate-700 mb-1">
                Model Number
              </label>
              <input 
                id="accessory-model"
                type="text" 
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                placeholder="e.g. A2442, Latitude 5420"
                value={form.modelNumber} 
                onChange={(e) => setForm((prev) => ({ ...prev, modelNumber: e.target.value }))} 
              />
            </div>
            <div>
              <label htmlFor="accessory-serial" className="block text-sm font-semibold text-slate-700 mb-1">
                SIM Card / Serial / IMEI Number
              </label>
              <input 
                id="accessory-serial"
                type="text" 
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                placeholder="e.g. 8991123456789, SN-472018"
                value={form.serialNumber} 
                onChange={(e) => setForm((prev) => ({ ...prev, serialNumber: e.target.value }))} 
              />
            </div>
          </div>

          {/* Employee Assignment */}
          <div>
            <label htmlFor="accessory-employee" className="block text-sm font-semibold text-slate-700 mb-1">
              Assign to Employee
            </label>
            <select 
              id="accessory-employee"
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white"
              value={form.employee} 
              onChange={(e) => {
                const empId = e.target.value;
                setForm((prev) => ({ 
                  ...prev, 
                  employee: empId,
                  // If we assign to a user, auto switch status to 'assigned'
                  status: empId ? 'assigned' : (prev.status === 'assigned' ? 'available' : prev.status),
                  // Auto fill current date if empty and assigning
                  assignmentDate: (empId && !prev.assignmentDate) ? new Date().toISOString().split('T')[0] : prev.assignmentDate
                }));
              }}
            >
              <option value="">-- Available in Stock (Unassigned) --</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Grid for Date & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="accessory-date" className="block text-sm font-semibold text-slate-700 mb-1">
                Assignment Date
              </label>
              <input 
                id="accessory-date"
                type="date" 
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
                value={form.assignmentDate}
                disabled={!form.employee}
                onChange={(e) => setForm((prev) => ({ ...prev, assignmentDate: e.target.value }))} 
              />
            </div>
            <div>
              <label htmlFor="accessory-status" className="block text-sm font-semibold text-slate-700 mb-1">
                Asset Status
              </label>
              <select 
                id="accessory-status"
                className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white"
                value={form.status}
                onChange={(e) => {
                  const status = e.target.value;
                  setForm((prev) => ({ 
                    ...prev, 
                    status,
                    // If marked available/damaged/lost, unassign the user
                    employee: status !== 'assigned' ? '' : prev.employee,
                    assignmentDate: status !== 'assigned' ? '' : prev.assignmentDate
                  }));
                }}
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="accessory-notes" className="block text-sm font-semibold text-slate-700 mb-1">
              Identification Marks / Notes
            </label>
            <textarea 
              id="accessory-notes"
              className="input w-full rounded-theme border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 min-h-[90px]" 
              placeholder="e.g. Scratched bottom left, includes charger, phone number associated is +91-XXXXX..."
              value={form.notes} 
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} 
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <Button 
            type="submit" 
            disabled={saving} 
            className="px-5 py-2 inline-flex items-center justify-center"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AccessoriesManagementPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [modalMode, setModalMode] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Load accessories
  async function loadAccessories() {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        search: searchQuery || undefined,
        status: statusFilter || undefined
      };
      
      const { data } = await api.get('/v1/accessories', { params });
      setItems(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load accessories record.');
    } finally {
      setLoading(false);
    }
  }

  // Load active users list for assignment dropdown
  async function loadUsers() {
    try {
      const { data } = await api.get('/users', { params: { limit: 150 } });
      setUsers(data.items || []);
    } catch (err) {
      console.error('Error loading users for assignments dropdown:', err);
    }
  }

  useEffect(() => {
    loadAccessories();
  }, [page, statusFilter]);

  // Debounced search trigger (simulated via load effect or search button)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadAccessories();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreate() {
    setEditingItem(null);
    setModalMode('create');
  }

  function openEdit(item) {
    setEditingItem(item);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingItem(null);
  }

  async function handleSave(form) {
    setSaving(true);
    setError('');
    try {
      if (modalMode === 'create') {
        const { data } = await api.post('/v1/accessories', form);
        setItems((current) => [data, ...current]);
        setTotalItems((prev) => prev + 1);
      } else {
        const { data } = await api.put(`/v1/accessories/${editingItem._id}`, form);
        setItems((current) => current.map((item) => (item._id === data._id ? data : item)));
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save accessory record.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this accessory?')) return;
    setError('');
    try {
      await api.delete(`/v1/accessories/${id}`);
      setItems((current) => current.filter((item) => item._id !== id));
      setTotalItems((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete accessory.');
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Available
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            Assigned
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            Damaged
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            Lost
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-2xl inline-flex">
              <Laptop className="h-8 w-8" />
            </span>
            Accessories & Assets
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track which company assets (Laptops, SIM Cards, Mobiles, Keyboards, etc.) are assigned to which employees.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setPage(1);
              loadAccessories();
            }} 
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button 
            onClick={openCreate} 
            className="inline-flex items-center gap-2 px-4 py-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} /> Add Asset / SIM
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-theme bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Filter and Search Bar Card */}
      <Card className="p-4 bg-slate-50/50 border border-slate-100">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              className="w-full rounded-theme border border-slate-200 pl-10 pr-4 py-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              placeholder="Search by name, model number, SIM or serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56">
            <select
              className="w-full rounded-theme border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Search Button */}
          <button 
            type="submit" 
            className="rounded-theme bg-primary hover:bg-primary-dark text-white px-5 py-2.5 text-sm font-semibold transition shadow-sm"
          >
            Search
          </button>
        </form>
      </Card>

      {/* Asset List Table */}
      <Card className="overflow-hidden border border-slate-150">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-700 font-semibold">
                <th className="px-5 py-4">Asset Detail</th>
                <th className="px-5 py-4">Serial / SIM Number</th>
                <th className="px-5 py-4">Assigned To</th>
                <th className="px-5 py-4">Assignment Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-slate-300" />
                      <span>Loading accessories data...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <Smartphone size={36} className="text-slate-300" />
                      <span>No accessories or assets found. Click 'Add Asset / SIM' to create one.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-slate-100 rounded-lg text-slate-600">
                          {item.name.toLowerCase().includes('sim') || item.name.toLowerCase().includes('phone') ? (
                            <Smartphone size={16} />
                          ) : (
                            <Laptop size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                          {item.modelNumber && (
                            <span className="text-xs font-semibold text-slate-400 mt-1 block">
                              Model: {item.modelNumber}
                            </span>
                          )}
                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-1 max-w-[280px] truncate" title={item.notes}>
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 text-xs">
                      {item.serialNumber || '—'}
                    </td>
                    <td className="px-5 py-4">
                      {item.employee ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {item.employee.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{item.employee.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.employee.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {item.assignmentDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(item.assignmentDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => openEdit(item)} 
                          className="p-1.5 hover:bg-slate-100 rounded-theme text-blue-600 hover:text-blue-700 transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDelete(item._id)} 
                          className="p-1.5 hover:bg-slate-100 rounded-theme text-rose-600 hover:text-rose-700 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50/50">
            <span className="text-xs font-medium text-slate-500">
              Showing page {page} of {totalPages} ({totalItems} total items)
            </span>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-theme border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-theme border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Dialog */}
      {modalMode && (
        <AccessoryModal 
          mode={modalMode} 
          accessory={editingItem} 
          users={users} 
          saving={saving} 
          onClose={closeModal} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}
