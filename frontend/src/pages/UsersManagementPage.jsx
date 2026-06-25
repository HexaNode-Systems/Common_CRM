import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, PencilLine, X, Calendar, DollarSign, Check, Lock, Unlock, FileSpreadsheet } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
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

// HR User Creation/Edit Form Modal
function UserFormModal({ mode, user, roles, saving, onClose, onSave, isHR }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    isActive: true,
    joiningDate: '',
    employmentClassification: 'regular_employee',
    baseSalary: 0,
    monthlyLeaveQuota: 2
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let joinDateStr = '';
    if (user?.joiningDate) {
      const d = new Date(user.joiningDate);
      joinDateStr = d.toISOString().split('T')[0];
    }
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.roleSlug || user?.role || '',
      password: '',
      isActive: typeof user?.isActive === 'boolean' ? user.isActive : true,
      joiningDate: joinDateStr,
      employmentClassification: user?.employmentClassification || 'regular_employee',
      baseSalary: user?.baseSalary || 0,
      monthlyLeaveQuota: user?.monthlyLeaveQuota ?? 2
    });
  }, [user]);

  const title = mode === 'create' ? 'Add New User' : `Edit User Details: ${user?.name || ''}`;
  const statusLabel = mode === 'create' ? 'Initial Status' : 'Account Status';
  const availableRoles = useMemo(() => {
    const currentRole = user?.roleSlug || user?.role;
    if (!currentRole || roles.some((role) => role.slug === currentRole)) return roles;
    return [{ _id: currentRole, slug: currentRole }, ...roles];
  }, [roles, user]);

  const isEmployeeRole = form.role && form.role !== 'customer';

  function submit(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm overflow-y-auto">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close user form" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-2xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Manage login credentials, role access, and account state.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                  <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm((current) => ({ ...current, isActive: true }))} className="h-4 w-4 accent-primary" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                  <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm((current) => ({ ...current, isActive: false }))} className="h-4 w-4 accent-primary" />
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
                  placeholder={mode === 'create' ? 'Create a secure password' : 'Leave blank to keep current password'}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 transition hover:text-slate-900" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          {/* HR & Compensation Settings Section */}
          {isHR && isEmployeeRole && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">HR & Compensation Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Joining Date *</span>
                  <input
                    type="date"
                    required
                    value={form.joiningDate}
                    onChange={(event) => setForm((current) => ({ ...current, joiningDate: event.target.value }))}
                    className="input"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Employment Classification *</span>
                  <select
                    value={form.employmentClassification}
                    onChange={(event) => setForm((current) => ({ ...current, employmentClassification: event.target.value }))}
                    className="input"
                  >
                    <option value="regular_employee">Regular Employee</option>
                    <option value="intern">Intern</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    {form.employmentClassification === 'intern' ? 'Monthly Stipend Amount *' : 'Base Monthly Salary *'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.baseSalary}
                    onChange={(event) => setForm((current) => ({ ...current, baseSalary: Number(event.target.value) }))}
                    className="input"
                    placeholder="e.g. 45000"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Monthly Paid Leave Quota *</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.monthlyLeaveQuota}
                    onChange={(event) => setForm((current) => ({ ...current, monthlyLeaveQuota: Number(event.target.value) }))}
                    className="input"
                    placeholder="Default 2 days"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 bg-white">Cancel</button>
          <Button disabled={saving} type="submit" className="px-4 py-2">
            {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Attendance Management Modal
function AttendanceModal({ employee, monthYear, onClose, isFrozen }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [year, month] = monthYear.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  async function loadAttendance() {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/attendance', {
        params: { employeeId: employee._id, monthYear }
      });

      const dbRecords = data.items || [];
      const temp = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${monthYear}-${String(d).padStart(2, '0')}`;
        const match = dbRecords.find(
          (r) => new Date(r.date).getUTCDate() === d
        );
        temp.push({
          date: dateStr,
          status: match ? match.status : 'Present'
        });
      }
      setRecords(temp);
    } catch (err) {
      setError('Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [employee._id, monthYear]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.post('/v1/attendance', {
        employeeId: employee._id,
        monthYear,
        records
      });
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance logs.');
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(index, value) {
    const updated = [...records];
    updated[index].status = value;
    setRecords(updated);
  }

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let approved = 0;
    for (const r of records) {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent (Unpaid)') absent++;
      else if (r.status === 'Approved Paid Leave') approved++;
    }
    return { present, absent, approved };
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manage Attendance: {employee.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Record daily status for {monthYear} cycle.</p>
          </div>
          <button type="button" onClick={() => onClose(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <p className="mx-5 mt-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {isFrozen && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-theme bg-amber-50 px-3 py-2 text-sm text-amber-700 font-semibold border border-amber-200">
            <Lock size={16} />
            <span>Salary sheet is frozen/Paid. Editing attendance is locked.</span>
          </div>
        )}

        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <p className="text-xs text-slate-500 font-medium uppercase">Present</p>
            <p className="text-lg font-bold text-slate-900">{summary.present} Days</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <p className="text-xs text-slate-500 font-medium uppercase">Absent (Unpaid)</p>
            <p className="text-lg font-bold text-slate-900">{summary.absent} Days</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <p className="text-xs text-slate-500 font-medium uppercase">Paid Leave</p>
            <p className="text-lg font-bold text-slate-900">{summary.approved} Days</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <p className="text-center text-slate-500 py-10">Loading attendance data...</p>
          ) : (
            records.map((r, index) => (
              <div key={r.date} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                <span className="font-semibold text-slate-700">Day {index + 1} ({formatDate(r.date)})</span>
                <select
                  disabled={isFrozen}
                  value={r.status}
                  onChange={(e) => handleStatusChange(index, e.target.value)}
                  className="input max-w-[200px]"
                >
                  <option value="Present">Present</option>
                  <option value="Absent (Unpaid)">Absent (Unpaid)</option>
                  <option value="Approved Paid Leave">Approved Paid Leave</option>
                </select>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button type="button" onClick={() => onClose(false)} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 bg-white">Cancel</button>
          {!isFrozen && (
            <Button disabled={saving} onClick={handleSave} className="px-4 py-2">
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Payroll Ledger Modal Sheet
function PayrollLedgerModal({ payroll, onClose }) {
  const [form, setForm] = useState({
    baseSalary: 0,
    leaveDeductions: 0,
    rebate: 0,
    rebateComment: '',
    manualDeduction: 0,
    manualDeductionComment: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isFrozen = payroll.status === 'Paid';

  useEffect(() => {
    setForm({
      baseSalary: payroll.baseSalary || 0,
      leaveDeductions: payroll.leaveDeductions || 0,
      rebate: payroll.rebate || 0,
      rebateComment: payroll.rebateComment || '',
      manualDeduction: payroll.manualDeduction || 0,
      manualDeductionComment: payroll.manualDeductionComment || ''
    });
  }, [payroll]);

  const netPayable = useMemo(() => {
    return Math.max(0, form.baseSalary - form.leaveDeductions + form.rebate - form.manualDeduction);
  }, [form]);

  async function handleSave(status = 'Draft') {
    setSaving(true);
    setError('');
    try {
      await api.post('/v1/payroll', {
        employeeId: payroll.employee._id,
        monthYear: payroll.monthYear,
        baseSalary: form.baseSalary,
        leaveDeductions: form.leaveDeductions,
        rebate: form.rebate,
        rebateComment: form.rebateComment,
        manualDeduction: form.manualDeduction,
        manualDeductionComment: form.manualDeductionComment,
        status
      });
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payroll.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePayAndFreeze() {
    if (!window.confirm('Are you sure you want to FREEZE and process payment? All details will become permanently read-only.')) return;
    setSaving(true);
    setError('');
    try {
      // First save current inputs as Draft
      const { data } = await api.post('/v1/payroll', {
        employeeId: payroll.employee._id,
        monthYear: payroll.monthYear,
        baseSalary: form.baseSalary,
        leaveDeductions: form.leaveDeductions,
        rebate: form.rebate,
        rebateComment: form.rebateComment,
        manualDeduction: form.manualDeduction,
        manualDeductionComment: form.manualDeductionComment,
        status: 'Draft'
      });

      // Then trigger pay/freeze action
      await api.patch(`/v1/payroll/${data._id}/pay`);
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete payroll freeze.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Process Salary Sheet: {payroll.employee.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Billing cycle: {payroll.monthYear}</p>
          </div>
          <button type="button" onClick={() => onClose(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <p className="mx-5 mt-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {isFrozen && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-theme bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-semibold border border-emerald-200">
            <Lock size={16} />
            <span>This salary cycle has been marked as Paid and frozen. Editing is locked.</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm">
          {/* Base Salary */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Line Item 1 (Base Salary / Stipend)</p>
              <p className="text-xs text-slate-500">Classification: {payroll.employee.employmentClassification === 'intern' ? 'Intern (Stipend)' : 'Regular Staff'}</p>
            </div>
            <p className="text-base font-bold text-slate-900">₹{form.baseSalary.toLocaleString('en-IN')}</p>
          </div>

          {/* Leave Penalty */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Line Item 2 (Calculated Leave Deductions)</p>
                <p className="text-xs text-slate-500">Excess leaves are penalized based on daily rate.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[150px]">
                <span className="font-semibold text-slate-600">₹</span>
                <input
                  disabled={isFrozen}
                  type="number"
                  min="0"
                  value={form.leaveDeductions}
                  onChange={(e) => setForm((c) => ({ ...c, leaveDeductions: Number(e.target.value) }))}
                  className="input text-right"
                />
              </div>
            </div>
            {payroll.attendanceStats && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                Calculated penalty: {payroll.attendanceStats.absentDays} absent day(s) + excess leaves beyond quota.
              </p>
            )}
          </div>

          {/* Rebates */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Line Item 3 (Rebate / Performance Bonus)</p>
                <p className="text-xs text-slate-500">Additions or performance target bonuses.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[150px]">
                <span className="font-semibold text-slate-600 text-emerald-600">+ ₹</span>
                <input
                  disabled={isFrozen}
                  type="number"
                  min="0"
                  value={form.rebate}
                  onChange={(e) => setForm((c) => ({ ...c, rebate: Number(e.target.value) }))}
                  className="input text-right text-emerald-700 font-semibold"
                />
              </div>
            </div>
            <input
              disabled={isFrozen}
              type="text"
              placeholder="Comment (e.g. +$5,000 for sales target hit)"
              value={form.rebateComment}
              onChange={(e) => setForm((c) => ({ ...c, rebateComment: e.target.value }))}
              className="input text-xs"
            />
          </div>

          {/* Cuts */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Line Item 4 (Other Deductions / Tax Holds)</p>
                <p className="text-xs text-slate-500">Manual cuts, advance deductions or tax holds.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[150px]">
                <span className="font-semibold text-slate-600 text-rose-600">- ₹</span>
                <input
                  disabled={isFrozen}
                  type="number"
                  min="0"
                  value={form.manualDeduction}
                  onChange={(e) => setForm((c) => ({ ...c, manualDeduction: Number(e.target.value) }))}
                  className="input text-right text-rose-700 font-semibold"
                />
              </div>
            </div>
            <input
              disabled={isFrozen}
              type="text"
              placeholder="Description (e.g. -$1,500 for missing equipment)"
              value={form.manualDeductionComment}
              onChange={(e) => setForm((c) => ({ ...c, manualDeductionComment: e.target.value }))}
              className="input text-xs"
            />
          </div>
        </div>

        {/* Live calculated formula footer */}
        <div className="border-t border-slate-200 px-5 py-4 bg-slate-900 text-white space-y-2">
          <div className="flex justify-between items-center text-sm text-slate-400">
            <span>Net Payable Formula</span>
            <span className="font-mono text-xs">₹{form.baseSalary} - ₹{form.leaveDeductions} + ₹{form.rebate} - ₹{form.manualDeduction}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider text-xs">Net Payable Salary</span>
            <span className="text-2xl font-black text-emerald-400">₹{netPayable.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button type="button" onClick={() => onClose(false)} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 bg-white">Cancel</button>
          {!isFrozen && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('Draft')}
                className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handlePayAndFreeze}
                className="rounded-theme bg-primary hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition inline-flex items-center gap-1.5"
              >
                <Check size={16} />
                Freeze & Pay
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Generate months dynamically
const MONTH_OPTIONS = [
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' }
];

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'hr'

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [error, setError] = useState('');

  // Payroll specific states
  const [payrollMonth, setPayrollMonth] = useState('2026-06');
  const [classFilter, setClassFilter] = useState('all'); // 'all', 'regular_employee', 'intern'
  const [posFilter, setPosFilter] = useState('');
  const [payrollItems, setPayrollItems] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Modals for HR workflow
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [ledgerTarget, setLedgerTarget] = useState(null);

  const activeRoles = useMemo(() => roles.filter((role) => role.isActive !== false), [roles]);

  const isHRAdmin = useMemo(() => {
    const role = currentUser?.role?.toLowerCase();
    return role === 'super_admin' || role === 'hr_manager';
  }, [currentUser]);

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

  async function loadPayroll() {
    if (!isHRAdmin) return;
    setLoadingPayroll(true);
    setError('');
    try {
      const { data } = await api.get('/v1/payroll', {
        params: { monthYear: payrollMonth }
      });
      setPayrollItems(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payroll list.');
    } finally {
      setLoadingPayroll(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'hr') {
      loadPayroll();
    }
  }, [activeTab, payrollMonth]);

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
      if (activeTab === 'hr') {
        loadPayroll();
      }
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

  // Filter payroll items
  const filteredPayroll = useMemo(() => {
    return payrollItems.filter((item) => {
      const emp = item.employee;
      if (!emp) return false;
      const matchesClass = classFilter === 'all' || emp.employmentClassification === classFilter;
      const matchesPos = !posFilter || String(emp.role).toLowerCase() === posFilter.toLowerCase();
      return matchesClass && matchesPos;
    });
  }, [payrollItems, classFilter, posFilter]);

  return (
    <div>
      {/* Title Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Users & HR Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage user credentials, role access, and payroll cycles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={activeTab === 'hr' ? loadPayroll : loadData} className="inline-flex items-center gap-2 px-3 py-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2">
            <Plus size={16} />
            Add New
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {isHRAdmin && (
        <div className="mb-6 flex border-b border-slate-200 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2.5 transition border-b-2 ${activeTab === 'directory' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            User Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hr')}
            className={`px-4 py-2.5 transition border-b-2 ${activeTab === 'hr' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            HR & Payroll Dashboard
          </button>
        </div>
      )}

      {error ? <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {activeTab === 'directory' ? (
        /* Standard User Directory View */
        <Card>
          <div className="w-full overflow-x-auto">
            <table className="min-w-[920px] w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-3 font-semibold">Name / Title</th>
                  <th className="px-3 py-3 font-semibold">Type / Status</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Created Date</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td className="px-3 py-4 text-slate-500" colSpan="5">Loading directory...</td></tr>
                ) : users.length ? (
                  users.map((u) => (
                    <tr key={u._id} className="transition hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {normalizeRoleLabel(u.roleLabel || u.role)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <StatusBadge active={u.isActive} />
                          <StatusToggle active={u.isActive} disabled={savingId === u._id} onChange={() => toggleStatus(u)} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => openEdit(u)} className="inline-flex items-center gap-1 font-semibold text-primary transition hover:text-blue-700">
                          <PencilLine size={16} />
                          Edit Details
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
      ) : (
        /* HR & Payroll Dashboard View */
        <div className="space-y-4">
          <Card>
            {/* Filter controls */}
            <div className="grid gap-4 md:grid-cols-4 pb-4 border-b border-slate-200 items-end">
              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Employment Structure</span>
                <div className="flex rounded-theme border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setClassFilter('all')}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-theme transition ${classFilter === 'all' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassFilter('regular_employee')}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-theme transition ${classFilter === 'regular_employee' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassFilter('intern')}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-theme transition ${classFilter === 'intern' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Interns
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Designation / Role</span>
                <select
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Roles</option>
                  <option value="trainer">Trainer</option>
                  <option value="counselor">Counselor</option>
                  <option value="developer">Developer</option>
                  <option value="sales_executive">Sales Executive</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Salary Cycle</span>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="input"
                >
                  {MONTH_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Payroll Data Table */}
            <div className="w-full overflow-x-auto mt-4">
              <table className="min-w-[1100px] w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-3 font-semibold">Employee & Position</th>
                    <th className="px-3 py-3 font-semibold">Joining & Tenure</th>
                    <th className="px-3 py-3 font-semibold">Attendance & Leaves</th>
                    <th className="px-3 py-3 font-semibold">Net Payout</th>
                    <th className="px-3 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPayroll ? (
                    <tr><td className="px-3 py-6 text-slate-500" colSpan="5">Loading payroll details...</td></tr>
                  ) : filteredPayroll.length ? (
                    filteredPayroll.map((item) => {
                      const emp = item.employee;
                      const stats = item.attendanceStats || { presentDays: 0, absentDays: 0, approvedLeaves: 0, totalWorkingDays: 30 };
                      const isPaid = item.status === 'Paid';

                      return (
                        <tr key={emp._id} className="transition hover:bg-slate-50">
                          <td className="px-3 py-4">
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 mt-1">
                              {normalizeRoleLabel(emp.role)}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <p className="text-slate-700 font-medium">{emp.joiningDate ? formatDate(emp.joiningDate) : '-'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Tenure: {item.tenure || '-'}</p>
                          </td>
                          <td className="px-3 py-4">
                            <div className="space-y-1">
                              <p className="text-slate-800 font-medium">
                                Present: <span className="font-semibold">{stats.presentDays}</span> / {stats.totalWorkingDays} days
                              </p>
                              <p className="text-xs text-slate-500">
                                Approved Leaves: <span className="font-semibold text-slate-700">{stats.approvedLeaves}</span> / {emp.monthlyLeaveQuota || 2} quota
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <p className="text-base font-bold text-slate-900">₹{item.netPayable.toLocaleString('en-IN')}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold mt-1 ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {isPaid ? <Lock size={10} /> : <Unlock size={10} />}
                              {item.status || 'Draft'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setAttendanceTarget(item)}
                                className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline"
                              >
                                <Calendar size={14} />
                                Manage Attendance
                              </button>
                              <button
                                type="button"
                                onClick={() => setLedgerTarget(item)}
                                className="inline-flex items-center gap-1 font-semibold text-emerald-600 transition hover:underline"
                              >
                                <FileSpreadsheet size={14} />
                                Process Salary Sheet
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td className="px-3 py-4 text-slate-500" colSpan="5">No employees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {modalMode ? (
        <UserFormModal
          mode={modalMode}
          user={selectedUser}
          roles={activeRoles}
          saving={formSaving}
          isHR={isHRAdmin}
          onClose={closeModal}
          onSave={saveUser}
        />
      ) : null}

      {/* Attendance Modal */}
      {attendanceTarget && (
        <AttendanceModal
          employee={attendanceTarget.employee}
          monthYear={payrollMonth}
          isFrozen={attendanceTarget.status === 'Paid'}
          onClose={(updated) => {
            setAttendanceTarget(null);
            if (updated) loadPayroll();
          }}
        />
      )}

      {/* Payroll Ledger Modal */}
      {ledgerTarget && (
        <PayrollLedgerModal
          payroll={ledgerTarget}
          onClose={(updated) => {
            setLedgerTarget(null);
            if (updated) loadPayroll();
          }}
        />
      )}
    </div>
  );
}
