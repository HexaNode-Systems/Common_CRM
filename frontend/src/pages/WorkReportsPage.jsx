import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { X, FileText, Search, Plus, Calendar, Clock, ChevronRight, ChevronLeft, PencilLine, Trash2 } from 'lucide-react';

const PAGE_SIZE = 20;
const inputCls = 'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none text-slate-700';

// Today in the viewer's own calendar (not UTC), as YYYY-MM-DD.
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2026-10-22" → "22 Oct 2026" without any time-zone shift.
function formatDay(day) {
  if (!day) return '-';
  const [y, m, d] = String(day).slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

const emptyForm = () => ({ date: localToday(), tasksCompleted: '', hoursWorked: 8, challenges: '', nextDayPlan: '' });

function formProblem(form, today) {
  if (!form.date) return 'Choose the report date.';
  if (form.date > today) return 'You can’t file a report for a future date.';
  if (!form.tasksCompleted.trim()) return 'Tasks completed is required.';
  const hours = Number(form.hoursWorked);
  if (!Number.isFinite(hours) || hours < 0.25 || hours > 24) return 'Hours worked must be between 0.25 and 24.';
  return '';
}

export default function WorkReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [today, setToday] = useState(localToday());

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [employees, setEmployees] = useState([]);

  // Create / edit
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', report }
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  async function fetchReports(nextPage = page) {
    const id = ++requestId.current;
    setLoading(true);
    setListError('');
    try {
      const params = { page: nextPage, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (selectedUser) params.user = selectedUser;
      const { data } = await api.get('/work-reports', { params });
      if (id !== requestId.current) return; // a newer search started
      setReports(data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      setIsSupervisor(Boolean(data.isSupervisor));
      if (data.today) setToday(data.today);
    } catch (err) {
      if (id === requestId.current) setListError(err.response?.data?.message || 'Unable to load work reports.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  // Search waits until typing pauses.
  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { fetchReports(page); }, [search, fromDate, toDate, selectedUser, page]);

  useEffect(() => {
    if (!isSupervisor || employees.length) return;
    api.get('/work-reports/team').then(({ data }) => setEmployees(data.items || [])).catch(() => setEmployees([]));
  }, [isSupervisor]);

  function setFilter(setter) {
    return (value) => { setter(value); setPage(1); };
  }

  function openCreate() {
    setForm(emptyForm());
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(report) {
    setForm({
      date: report.day || String(report.date).slice(0, 10),
      tasksCompleted: report.tasksCompleted || '',
      hoursWorked: report.hoursWorked ?? 8,
      challenges: report.challenges || '',
      nextDayPlan: report.nextDayPlan || ''
    });
    setError('');
    setModal({ mode: 'edit', report });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = formProblem(form, today);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, hoursWorked: Number(form.hoursWorked) };
      const { data } = modal.mode === 'create'
        ? await api.post('/work-reports', payload)
        : await api.put(`/work-reports/${modal.report._id}`, payload);
      setModal(null);
      setSelectedReport(data);
      setNotice(modal.mode === 'create' ? 'Work report submitted.' : 'Work report updated.');
      window.setTimeout(() => setNotice(''), 3000);
      fetchReports(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save the work report.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(report) {
    if (!window.confirm(`Delete ${report.user?.name ? `${report.user.name}'s` : 'this'} report for ${formatDay(report.day)}?`)) return;
    try {
      await api.delete(`/work-reports/${report._id}`);
      setSelectedReport(null);
      fetchReports(page);
    } catch (err) {
      setListError(err.response?.data?.message || 'Unable to delete the report.');
    }
  }

  const firstRow = pagination.total ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(pagination.page * PAGE_SIZE, pagination.total);
  const hasFilters = Boolean(search || fromDate || toDate || selectedUser);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daily Work Reports</h1>
          <p className="text-sm text-slate-500">
            {isSupervisor
              ? 'Review and search end-of-day work summaries submitted by team members.'
              : 'Submit your end-of-day work summaries and track your history.'}
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white">
          <Plus size={16} />
          Submit Work Report
        </Button>
      </div>

      {notice ? <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
      {listError ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, plan, or challenges..."
                maxLength={100}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1">
                <span className="shrink-0 font-medium text-slate-400">From:</span>
                <input type="date" max={toDate || today} value={fromDate} onChange={(e) => setFilter(setFromDate)(e.target.value)} className="w-full text-slate-700 focus:outline-none" />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1">
                <span className="shrink-0 font-medium text-slate-400">To:</span>
                <input type="date" min={fromDate || undefined} max={today} value={toDate} onChange={(e) => setFilter(setToDate)(e.target.value)} className="w-full text-slate-700 focus:outline-none" />
              </label>
              {isSupervisor ? (
                <select value={selectedUser} onChange={(e) => setFilter(setSelectedUser)(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 focus:border-primary focus:outline-none">
                  <option value="">All Employees</option>
                  {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm">{hasFilters ? 'No reports match these filters.' : 'No work reports yet.'}</p>
              </div>
            ) : (
              reports.map((report) => (
                <button
                  type="button"
                  key={report._id}
                  onClick={() => setSelectedReport(report)}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    selectedReport?._id === report._id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Calendar size={12} />{formatDay(report.day)}</span>
                      <span className="flex items-center gap-0.5 text-2xs text-slate-400"><Clock size={10} />{report.hoursWorked} hrs</span>
                    </div>
                    {isSupervisor ? <p className="text-xs font-bold text-slate-700">Submitted by: {report.user?.name}</p> : null}
                    <p className="line-clamp-1 text-sm text-slate-800">{report.tasksCompleted}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </button>
              ))
            )}
          </div>

          {!loading && pagination.total > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>Showing {firstRow}–{lastRow} of {pagination.total}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1"><ChevronLeft size={14} />Prev</Button>
                <span>Page {pagination.page} of {pagination.pages}</span>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="gap-1">Next<ChevronRight size={14} /></Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          {selectedReport ? (
            <Card className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span>Report Date</span>
                  <span>{formatDay(selectedReport.day)}</span>
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-900">{isSupervisor ? selectedReport.user?.name : 'My Work Report'}</h3>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-semibold text-slate-700">
                  <Clock size={10} />{selectedReport.hoursWorked} Hours Logged
                </span>
                {selectedReport.editedAt ? <p className="mt-1 text-2xs text-slate-400">Edited {new Date(selectedReport.editedAt).toLocaleString()}</p> : null}
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Tasks Completed</h4>
                  <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 leading-relaxed text-slate-700">{selectedReport.tasksCompleted}</p>
                </div>
                {selectedReport.challenges ? (
                  <div>
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Challenges & Blockers</h4>
                    <p className="whitespace-pre-wrap rounded-xl border border-amber-100/50 bg-amber-50/50 p-3 leading-relaxed text-amber-800">{selectedReport.challenges}</p>
                  </div>
                ) : null}
                {selectedReport.nextDayPlan ? (
                  <div>
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Plan for Next working Day</h4>
                    <p className="whitespace-pre-wrap rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-3 leading-relaxed text-indigo-800">{selectedReport.nextDayPlan}</p>
                  </div>
                ) : null}
              </div>

              {selectedReport.canEdit || selectedReport.canDelete ? (
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  {selectedReport.canEdit ? <Button variant="outline" size="sm" onClick={() => openEdit(selectedReport)} className="gap-1"><PencilLine size={14} />Edit</Button> : null}
                  {selectedReport.canDelete ? <Button variant="outline" size="sm" onClick={() => handleDelete(selectedReport)} className="gap-1 text-red-600"><Trash2 size={14} />Delete</Button> : null}
                </div>
              ) : null}
            </Card>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FileText size={36} className="mb-2 text-slate-200" />
              <h3 className="text-sm font-semibold text-slate-900">No Report Selected</h3>
              <p className="mt-1 max-w-[200px] text-xs text-slate-400">Select a card on the left to see complete daily summary details.</p>
            </div>
          )}
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={() => setModal(null)} />
          <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{modal.mode === 'create' ? 'Submit Daily Work Report' : 'Edit Work Report'}</h2>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
              {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div> : null}

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Report Date</span>
                  <input type="date" required max={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Hours Logged</span>
                  <input type="number" required min={0.25} max={24} step={0.25} value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} className={inputCls} />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Tasks Completed</span>
                <textarea required rows={4} maxLength={5000} placeholder="List the work you finished today" value={form.tasksCompleted} onChange={(e) => setForm({ ...form, tasksCompleted: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Challenges & Blockers (Optional)</span>
                <textarea rows={2} maxLength={3000} placeholder="Mention any issues or support needed..." value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Plan for Next working Day (Optional)</span>
                <textarea rows={2} maxLength={3000} placeholder="What will you work on tomorrow?" value={form.nextDayPlan} onChange={(e) => setForm({ ...form, nextDayPlan: e.target.value })} className={inputCls} />
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-primary text-white">{saving ? 'Saving...' : modal.mode === 'create' ? 'Submit Report' : 'Save Changes'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
