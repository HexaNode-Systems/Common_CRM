import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, PencilLine, X, Calendar, Check, Lock, Unlock, FileSpreadsheet, Mail, Phone } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import Loader from '../components/Loader.jsx';

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
    phone: '',
    role: '',
    password: '',
    isActive: true,
    joiningDate: '',
    employmentClassification: 'regular_employee',
    baseSalary: 0,
    monthlyLeaveQuota: 2,
    profilePhoto: '',
    city: '',
    location: '',
    correspondenceAddress: '',
    permanentAddress: '',
    gender: '',
    age: ''
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
      phone: user?.phone || '',
      role: user?.roleSlug || user?.role || '',
      password: '',
      isActive: typeof user?.isActive === 'boolean' ? user.isActive : true,
      joiningDate: joinDateStr,
      employmentClassification: user?.employmentClassification || 'regular_employee',
      baseSalary: user?.baseSalary || 0,
      monthlyLeaveQuota: user?.monthlyLeaveQuota ?? 2,
      profilePhoto: user?.profilePhoto || '',
      city: user?.city || '',
      location: user?.location || '',
      correspondenceAddress: user?.correspondenceAddress || '',
      permanentAddress: user?.permanentAddress || '',
      gender: user?.gender || '',
      age: user?.age || ''
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

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">User ID / Email</span>
              <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="input" placeholder="user@example.com" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">WhatsApp / Phone Number</span>
              <input type="text" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="input" placeholder="e.g. 919876543210" />
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

          {/* Profile & Location Details Section */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Profile & Location Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Gender</span>
                <select
                  value={form.gender}
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Age</span>
                <input
                  type="number"
                  value={form.age}
                  onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                  className="input"
                  placeholder="e.g. 28"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className="input"
                  placeholder="e.g. Noida"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Location</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  className="input"
                  placeholder="e.g. Sector 62"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Correspondence Address</span>
                <textarea
                  rows={2}
                  value={form.correspondenceAddress}
                  onChange={(event) => setForm((current) => ({ ...current, correspondenceAddress: event.target.value }))}
                  className="input resize-none"
                  placeholder="Street details..."
                />
              </label>

              <div className="block sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">Permanent Address</span>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, permanentAddress: current.correspondenceAddress }))}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Same as correspondence address
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={form.permanentAddress}
                  onChange={(event) => setForm((current) => ({ ...current, permanentAddress: event.target.value }))}
                  className="input resize-none"
                  placeholder="Street details..."
                />
              </div>

              <div className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Profile Photo URL</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.profilePhoto}
                    onChange={(event) => setForm((current) => ({ ...current, profilePhoto: event.target.value }))}
                    className="input flex-1"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-theme px-3 flex items-center justify-center text-xs font-semibold text-slate-700 transition">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('image', file);
                        try {
                          const res = await api.post('/auth/upload-avatar', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          setForm((current) => ({ ...current, profilePhoto: res.data.url }));
                        } catch (err) {
                          alert('Failed to upload image');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
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
const ATTENDANCE_OPTIONS = ['Present', 'Absent (Unpaid)', 'Approved Paid Leave', 'Holiday'];
const WEEKDAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' });

function AttendanceModal({ employee, monthYear, onClose, isFrozen, canEdit }) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [changed, setChanged] = useState({}); // date -> new status
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const readOnly = isFrozen || !canEdit;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/v1/attendance', { params: { employeeId: employee._id, monthYear } })
      .then(({ data }) => {
        if (!cancelled) setDays(data.days || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load attendance logs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employee._id, monthYear]);

  const statusOf = (day) => {
    const status = changed[day.date] ?? day.status ?? '';
    return status === 'Weekly Off' ? '' : status;
  };
  const isLockedDay = (day) => day.beforeJoining;
  const canMark = (day) => !isLockedDay(day) && !day.isFuture;

  function setStatus(day, value) {
    setChanged((current) => ({ ...current, [day.date]: value }));
  }

  // Marks every working day up to today that has no status yet as Present.
  function markUnmarkedPresent() {
    const next = { ...changed };
    for (const day of days) {
      if (canMark(day) && !day.weeklyOff && !statusOf(day)) next[day.date] = 'Present';
    }
    setChanged(next);
  }

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, leave: 0, unmarked: 0 };
    for (const day of days) {
      if (day.beforeJoining || day.weeklyOff) continue;
      const status = statusOf(day);
      if (status === 'Present') counts.present += 1;
      else if (status === 'Absent (Unpaid)') counts.absent += 1;
      else if (status === 'Approved Paid Leave') counts.leave += 1;
      else if (status !== 'Holiday') counts.unmarked += 1;
    }
    return counts;
  }, [days, changed]);

  async function handleSave() {
    const weeklyOffDates = new Set(days.filter((day) => day.weeklyOff).map((day) => day.date));
    const records = Object.entries(changed)
      .map(([date, status]) => ({ date, status: status || (weeklyOffDates.has(date) ? 'Weekly Off' : '') }))
      .filter((record) => record.status);
    if (!records.length) {
      onClose(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/v1/attendance', { employeeId: employee._id, monthYear, records });
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance logs.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attendance: {employee.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {monthYear} cycle. Weekly offs are greyed out; future days can only be marked as holidays.
            </p>
          </div>
          <button type="button" onClick={() => onClose(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <p className="mx-5 mt-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {isFrozen && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-theme bg-amber-50 px-3 py-2 text-sm text-amber-700 font-semibold border border-amber-200">
            <Lock size={16} />
            <span>Salary for this month is paid. Attendance is locked.</span>
          </div>
        )}
        {!isFrozen && !canEdit && (
          <p className="mx-5 mt-4 rounded-theme bg-slate-50 px-3 py-2 text-sm text-slate-600 border border-slate-200">
            You can view attendance. Editing needs the Attendance &ldquo;Update&rdquo; permission.
          </p>
        )}

        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 grid grid-cols-4 gap-3 text-center">
          {[
            ['Present', summary.present],
            ['Absent (Unpaid)', summary.absent],
            ['Paid Leave', summary.leave],
            ['Not marked', summary.unmarked],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-xs text-slate-500 font-medium uppercase">{label}</p>
              <p className={`text-lg font-bold ${label === 'Not marked' && value > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {!readOnly && summary.unmarked > 0 && (
          <div className="px-5 pt-3">
            <button type="button" onClick={markUnmarkedPresent} className="text-xs font-semibold text-primary hover:underline">
              Mark all unmarked days up to today as Present
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {loading ? (
            <Loader label="Loading attendance" />
          ) : (
            days.map((day) => {
              const status = statusOf(day);
              const dayLabel = `${formatDate(day.date)} · ${WEEKDAY.format(new Date(`${day.date}T00:00:00Z`))}`;
              let note = null;
              if (day.beforeJoining) note = 'Before joining';
              else if (day.weeklyOff && !status) note = 'Weekly off';

              return (
                <div key={day.date} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                  <span className={`font-semibold ${day.weeklyOff ? 'text-slate-400' : 'text-slate-700'}`}>{dayLabel}</span>
                  {day.beforeJoining ? (
                    <span className="text-xs text-slate-400">{note}</span>
                  ) : (
                    <select
                      disabled={readOnly}
                      value={status}
                      onChange={(e) => setStatus(day, e.target.value)}
                      className="input max-w-[210px]"
                      aria-label={`Attendance for ${day.date}`}
                    >
                      <option value="">{day.weeklyOff ? 'Weekly off' : day.isFuture ? 'Upcoming' : '— Not marked —'}</option>
                      {ATTENDANCE_OPTIONS.filter((option) => {
                        if (day.isFuture) return option === 'Holiday';
                        if (day.weeklyOff) return option === 'Present' || option === 'Holiday';
                        return true;
                      }).map((option) => (
                        <option key={option} value={option}>{option === 'Present' && day.weeklyOff ? 'Worked (Present)' : option}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button type="button" onClick={() => onClose(false)} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 bg-white">
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && (
            <Button disabled={saving || !Object.keys(changed).length} onClick={handleSave} className="px-4 py-2">
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Salary sheet. Base salary and attendance deductions come from the server (recalculated from
// the latest salary and attendance); HR only enters the rebate and other deductions.
function PayrollLedgerModal({ payroll, onClose, canEdit }) {
  const [form, setForm] = useState({ rebate: 0, rebateComment: '', manualDeduction: 0, manualDeductionComment: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isFrozen = payroll.status === 'Paid';
  const readOnly = isFrozen || !canEdit;
  const stats = payroll.attendanceStats || {};

  useEffect(() => {
    setForm({
      rebate: payroll.rebate || 0,
      rebateComment: payroll.rebateComment || '',
      manualDeduction: payroll.manualDeduction || 0,
      manualDeductionComment: payroll.manualDeductionComment || '',
    });
  }, [payroll]);

  const netPayable = useMemo(
    () => Math.max(0, (payroll.baseSalary || 0) - (payroll.leaveDeductions || 0) + (Number(form.rebate) || 0) - (Number(form.manualDeduction) || 0)),
    [payroll, form]
  );

  const saveDraft = () =>
    api.post('/v1/payroll', {
      employeeId: payroll.employee._id,
      monthYear: payroll.monthYear,
      rebate: Number(form.rebate) || 0,
      rebateComment: form.rebateComment,
      manualDeduction: Number(form.manualDeduction) || 0,
      manualDeductionComment: form.manualDeductionComment,
    });

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await saveDraft();
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payroll.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePayAndFreeze() {
    if (!window.confirm('Mark this salary as paid? The sheet and this month\'s attendance become read-only.')) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await saveDraft();
      try {
        await api.patch(`/v1/payroll/${data._id}/pay`, {});
      } catch (err) {
        // Some working days have no attendance: ask before paying them as present.
        if (err.response?.status === 409 && err.response.data?.code === 'UNMARKED_ATTENDANCE') {
          if (!window.confirm(`${err.response.data.message}\n\nPay anyway?`)) {
            setSaving(false);
            return;
          }
          await api.patch(`/v1/payroll/${data._id}/pay`, { acknowledgeUnmarked: true });
        } else {
          throw err;
        }
      }
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete payroll freeze.');
    } finally {
      setSaving(false);
    }
  }

  const deductionParts = [
    stats.absentDays ? `${stats.absentDays} absent` : null,
    stats.excessLeaves ? `${stats.excessLeaves} leave beyond quota` : null,
    stats.notJoinedDays ? `${stats.notJoinedDays} before joining` : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Salary Sheet: {payroll.employee.name}</h2>
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
            <span>
              Paid{payroll.paidAt ? ` on ${formatDate(payroll.paidAt)}` : ''}. This salary sheet is locked.
            </span>
          </div>
        )}
        {!isFrozen && stats.unmarkedDays > 0 && (
          <p className="mx-5 mt-4 rounded-theme bg-amber-50 px-3 py-2 text-sm text-amber-800 border border-amber-200">
            {stats.unmarkedDays} working day(s) have no attendance marked. They are counted as present.
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Base salary / stipend</p>
              <p className="text-xs text-slate-500">
                {payroll.employee.employmentClassification === 'intern' ? 'Intern (stipend)' : 'Regular staff'} · set in the employee&rsquo;s profile
              </p>
            </div>
            <p className="text-base font-bold text-slate-900">{rupees(payroll.baseSalary)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Attendance deductions</p>
              <p className="text-xs text-slate-500">
                {deductionParts.length
                  ? `${stats.deductionDays} day(s): ${deductionParts.join(', ')} × ${rupees(stats.perDaySalary)}/day`
                  : `No deductions · ${stats.workingDays ?? '-'} working days, ${stats.leaveQuota ?? 2} paid leave quota`}
              </p>
            </div>
            <p className="text-base font-bold text-rose-700">− {rupees(payroll.leaveDeductions)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Rebate / performance bonus</p>
                <p className="text-xs text-slate-500">Additions or target bonuses.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[150px]">
                <span className="whitespace-nowrap font-semibold text-emerald-600">+ ₹</span>
                <input disabled={readOnly} type="number" min="0" value={form.rebate} onChange={(e) => setForm((c) => ({ ...c, rebate: e.target.value }))} className="input text-right text-emerald-700 font-semibold" />
              </div>
            </div>
            <input disabled={readOnly} type="text" maxLength={300} placeholder="Reason (e.g. sales target hit)" value={form.rebateComment} onChange={(e) => setForm((c) => ({ ...c, rebateComment: e.target.value }))} className="input text-xs" />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Other deductions</p>
                <p className="text-xs text-slate-500">Advances, recoveries or tax holds.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[150px]">
                <span className="whitespace-nowrap font-semibold text-rose-600">− ₹</span>
                <input disabled={readOnly} type="number" min="0" value={form.manualDeduction} onChange={(e) => setForm((c) => ({ ...c, manualDeduction: e.target.value }))} className="input text-right text-rose-700 font-semibold" />
              </div>
            </div>
            <input disabled={readOnly} type="text" maxLength={300} placeholder="Reason (e.g. salary advance recovery)" value={form.manualDeductionComment} onChange={(e) => setForm((c) => ({ ...c, manualDeductionComment: e.target.value }))} className="input text-xs" />
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 bg-slate-900 text-white space-y-2">
          <div className="flex justify-between items-center text-sm text-slate-400">
            <span>Net payable</span>
            <span className="font-mono text-xs">
              {rupees(payroll.baseSalary)} − {rupees(payroll.leaveDeductions)} + {rupees(form.rebate)} − {rupees(form.manualDeduction)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider text-xs">Net payable salary</span>
            <span className="text-2xl font-black text-emerald-400">{rupees(isFrozen ? payroll.netPayable : netPayable)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button type="button" onClick={() => onClose(false)} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 bg-white">
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && (
            <>
              <button type="button" disabled={saving} onClick={handleSave} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">
                Save Draft
              </button>
              <button type="button" disabled={saving} onClick={handlePayAndFreeze} className="rounded-theme bg-primary text-white px-4 py-2 text-sm font-semibold transition inline-flex items-center gap-1.5">
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

// Last 24 months up to next month, newest first; default is the current month.
function buildMonthOptions(now = new Date()) {
  const options = [];
  const formatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
  for (let offset = 1; offset >= -24; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label: formatter.format(date) });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();
const CURRENT_MONTH = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

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
  const [payrollMonth, setPayrollMonth] = useState(CURRENT_MONTH);
  const [classFilter, setClassFilter] = useState('all'); // 'all', 'regular_employee', 'intern'
  const [posFilter, setPosFilter] = useState('');
  const [payrollItems, setPayrollItems] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Modals for HR workflow
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [ledgerTarget, setLedgerTarget] = useState(null);

  const activeRoles = useMemo(() => roles.filter((role) => role.isActive !== false), [roles]);

  // Payroll and attendance have their own permissions in Roles & Permissions.
  const can = (permission) => currentUser?.role === 'super_admin' || Boolean(currentUser?.permissions?.includes(permission));
  const canViewPayroll = can('payroll:read');
  const canEditPayroll = can('payroll:update');
  const canViewAttendance = can('attendance:read');
  const canEditAttendance = can('attendance:update');
  const isHRAdmin = canViewPayroll;

  const hasReadPermission = useMemo(() => {
    return currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('users:read');
  }, [currentUser]);

  const canCreateUsers = useMemo(() => {
    return currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('users:create');
  }, [currentUser]);

  const canUpdateUsers = useMemo(() => {
    return currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('users:update');
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

  function openView(user) {
    setSelectedUser(user);
    setModalMode('view');
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
      <PageHeader
        label="Team"
        title="Users & HR Management"
        description="Manage user credentials, role access, and payroll cycles."
        actions={
          <>
            <Button variant="outline" onClick={activeTab === 'hr' ? loadPayroll : loadData} className="gap-2">
              <RefreshCw size={15} />
              Refresh
            </Button>
            {canCreateUsers && (
              <Button onClick={openCreate} className="gap-2">
                <Plus size={15} />
                Add New
              </Button>
            )}
          </>
        }
      />

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
                  <th className="px-3 py-3 font-semibold">Sr. No.</th>
                  <th className="px-3 py-3 font-semibold">Name / Title</th>
                  <th className="px-3 py-3 font-semibold">Type / Status</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Created Date</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6"><Loader label="Loading users" /></td></tr>
                ) : users.length ? (
                  users.map((u, index) => (
                    <tr key={u._id} className="transition hover:bg-slate-50">
                      <td className="px-3 py-3 font-semibold text-slate-500">{index + 1}</td>
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
                          <StatusToggle active={u.isActive} disabled={savingId === u._id || !canUpdateUsers} onChange={() => toggleStatus(u)} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {hasReadPermission && (
                            <button
                              type="button"
                              onClick={() => openView(u)}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 transition hover:text-slate-900"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          )}
                          {canUpdateUsers && (
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="inline-flex items-center gap-1 font-semibold text-primary transition hover:text-blue-700"
                            >
                              <PencilLine size={16} />
                              Edit Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-4 text-slate-500" colSpan="6">No users found.</td></tr>
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
                  {[...new Set(payrollItems.map((item) => item.employee?.role).filter(Boolean))].sort().map((role) => (
                    <option key={role} value={role}>{normalizeRoleLabel(role)}</option>
                  ))}
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
                    <tr><td colSpan="5"><Loader label="Loading payroll" /></td></tr>
                  ) : filteredPayroll.length ? (
                    filteredPayroll.map((item) => {
                      const emp = item.employee;
                      const stats = item.attendanceStats || {};
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
                                Present: <span className="font-semibold">{stats.presentDays ?? 0}</span> / {stats.workingDays ?? '-'} working days
                              </p>
                              <p className="text-xs text-slate-500">
                                Absent: <span className="font-semibold text-slate-700">{stats.absentDays ?? 0}</span> · Paid leave: <span className="font-semibold text-slate-700">{stats.approvedLeaves ?? 0}</span> / {emp.monthlyLeaveQuota ?? 2} quota
                              </p>
                              {!isPaid && stats.unmarkedDays > 0 && (
                                <p className="text-xs font-semibold text-amber-700">{stats.unmarkedDays} day(s) not marked</p>
                              )}
                              {stats.notJoinedDays > 0 && (
                                <p className="text-xs text-slate-500">Joined mid-month ({stats.notJoinedDays} day(s) before joining)</p>
                              )}
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
                              {canViewAttendance ? (
                                <button
                                  type="button"
                                  onClick={() => setAttendanceTarget(item)}
                                  className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline"
                                >
                                  <Calendar size={14} />
                                  {canEditAttendance && !isPaid ? 'Manage Attendance' : 'View Attendance'}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400" title="Needs the Attendance permission in Roles & Permissions">
                                  No attendance access
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setLedgerTarget(item)}
                                className="inline-flex items-center gap-1 font-semibold text-emerald-600 transition hover:underline"
                              >
                                <FileSpreadsheet size={14} />
                                {canEditPayroll && !isPaid ? 'Process Salary Sheet' : 'View Salary Sheet'}
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
      {modalMode && modalMode !== 'view' ? (
        <UserFormModal
          mode={modalMode}
          user={selectedUser}
          roles={activeRoles}
          saving={formSaving}
          isHR={canEditPayroll}
          onClose={closeModal}
          onSave={saveUser}
        />
      ) : null}

      {/* User View Modal */}
      {modalMode === 'view' && selectedUser ? (
        <UserViewModal
          user={selectedUser}
          onClose={closeModal}
        />
      ) : null}

      {/* Attendance Modal */}
      {attendanceTarget && (
        <AttendanceModal
          employee={attendanceTarget.employee}
          monthYear={payrollMonth}
          isFrozen={attendanceTarget.status === 'Paid'}
          canEdit={canEditAttendance}
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
          canEdit={canEditPayroll}
          onClose={(updated) => {
            setLedgerTarget(null);
            if (updated) loadPayroll();
          }}
        />
      )}
    </div>
  );
}

// Read-Only User View Modal
function UserViewModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm overflow-y-auto">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">User Details View</h2>
            <p className="mt-1 text-xs text-slate-500">Full information details of the user.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar & Quick Stats */}
            <div className="md:col-span-1 flex flex-col items-center text-center p-4 border border-slate-100 rounded-theme bg-slate-50/50">
              <div className="relative mb-3">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="h-24 w-24 rounded-full object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border-2 border-white shadow-md">
                    {user.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'A'}
                  </div>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-950">{user.name}</h3>
              <p className="text-xs text-slate-500 capitalize mb-3">{(user.roleSlug || user.role || 'customer').replaceAll('_', ' ')}</p>
              
              <div className="w-full border-t border-slate-200/60 my-2 pt-2 text-left space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /> <span className="truncate">{user.email}</span></div>
                {user.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> <span>{user.phone}</span></div>}
                {user.gender && <div><span className="text-slate-400">Gender</span> <span className="capitalize">{user.gender}</span></div>}
                {user.age && <div><span className="text-slate-400">Age</span> <span>{user.age}</span></div>}
              </div>
            </div>

            {/* Profile details */}
            <div className="md:col-span-2 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">Location details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block font-semibold text-slate-500">City</span>
                    <span className="text-slate-800 font-medium">{user.city || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Location</span>
                    <span className="text-slate-800 font-medium">{user.location || 'Not provided'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block font-semibold text-slate-500">Correspondence Address</span>
                    <span className="text-slate-800 whitespace-pre-line font-medium">{user.correspondenceAddress || 'Not provided'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block font-semibold text-slate-500">Permanent Address</span>
                    <span className="text-slate-800 whitespace-pre-line font-medium">{user.permanentAddress || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">HR & Compensation Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block font-semibold text-slate-500">Joining Date</span>
                    <span className="text-slate-800 font-medium">{user.joiningDate ? new Intl.DateTimeFormat('en-GB').format(new Date(user.joiningDate)) : '-'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Employment classification</span>
                    <span className="text-slate-800 font-medium capitalize">{(user.employmentClassification || 'regular_employee').replaceAll('_', ' ')}</span>
                  </div>
                  {user.baseSalary !== undefined && (
                    <div>
                      <span className="block font-semibold text-slate-500">Base Salary / Stipend</span>
                      <span className="text-slate-800 font-bold">₹{(user.baseSalary || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div>
                    <span className="block font-semibold text-slate-500">Monthly Leaves Quota</span>
                    <span className="text-slate-800 font-medium">{user.monthlyLeaveQuota ?? 2} Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 bg-white">Close</button>
        </div>
      </div>
    </div>
  );
}
