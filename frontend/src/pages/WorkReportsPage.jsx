import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Clock,
  Filter,
  User,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export default function WorkReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  
  // Supervisors / Employees lookup
  const [employees, setEmployees] = useState([]);

  // Create report modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tasksCompleted: '',
    hoursWorked: 8,
    challenges: '',
    nextDayPlan: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSupervisor = ['super_admin', 'admin', 'manager'].includes(user?.role);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (selectedUser && isSupervisor) params.user = selectedUser;

      const res = await api.get('/work-reports', { params });
      setReports(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch work reports', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isSupervisor) return;
    try {
      const res = await api.get('/users?limit=100');
      // List active employees/staff
      const staffList = (res.data.items || []).filter(u => u.isActive && u.role !== 'customer');
      setEmployees(staffList);
    } catch (err) {
      console.error('Failed to fetch staff list', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchEmployees();
  }, [search, fromDate, toDate, selectedUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.tasksCompleted) {
      setError('Tasks completed field is required.');
      return;
    }
    if (form.hoursWorked <= 0) {
      setError('Hours worked must be greater than 0.');
      return;
    }

    try {
      const res = await api.post('/work-reports', form);
      setReports([res.data, ...reports]);
      setSuccess('✅ Daily work report submitted successfully!');
      setTimeout(() => {
        setIsSubmitOpen(false);
        setSuccess('');
        setForm({
          date: new Date().toISOString().split('T')[0],
          tasksCompleted: '',
          hoursWorked: 8,
          challenges: '',
          nextDayPlan: ''
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit daily work report.');
    }
  };

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
        <Button onClick={() => setIsSubmitOpen(true)} className="flex items-center gap-2 bg-primary text-white">
          <Plus size={16} />
          Submit Work Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Columns: Search & Filters + Reports List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, plan, or challenges..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1 bg-white">
                <span className="text-slate-400 shrink-0 font-medium">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full focus:outline-none text-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1 bg-white">
                <span className="text-slate-400 shrink-0 font-medium">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full focus:outline-none text-slate-700"
                />
              </div>

              {isSupervisor && (
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="rounded-xl border border-slate-200 p-2 focus:border-primary focus:outline-none text-slate-700 bg-white"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Reports Table/Cards list */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm">No work reports found.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report._id}
                  onClick={() => setSelectedReport(report)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 flex items-center justify-between gap-4 ${
                    selectedReport?._id === report._id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                      <span className="text-2xs text-slate-400 flex items-center gap-0.5">
                        <Clock size={10} />
                        {report.hoursWorked} hrs
                      </span>
                    </div>
                    {isSupervisor && (
                      <p className="text-xs font-bold text-slate-700">Submitted by: {report.user?.name}</p>
                    )}
                    <p className="text-sm text-slate-800 line-clamp-1">{report.tasksCompleted}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-1">
          {selectedReport ? (
            <Card className="border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Report Date</span>
                  <span>{new Date(selectedReport.date).toLocaleDateString()}</span>
                </div>
                <h3 className="mt-1 font-bold text-slate-900 text-base">
                  {isSupervisor ? selectedReport.user?.name : 'My Work Report'}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-semibold text-slate-700">
                  <Clock size={10} />
                  {selectedReport.hoursWorked} Hours Logged
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Tasks Completed</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.tasksCompleted}
                  </p>
                </div>

                {selectedReport.challenges && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Challenges & Blockers</h4>
                    <p className="text-amber-800 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 whitespace-pre-wrap leading-relaxed">
                      {selectedReport.challenges}
                    </p>
                  </div>
                )}

                {selectedReport.nextDayPlan && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Plan for Next working Day</h4>
                    <p className="text-indigo-800 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 whitespace-pre-wrap leading-relaxed">
                      {selectedReport.nextDayPlan}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center h-48">
              <FileText size={36} className="text-slate-200 mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">No Report Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Select a card on the left to see complete daily summary details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Report Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
          <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Submit Daily Work Report</h2>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-700">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Report Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours Logged</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={24}
                    value={form.hoursWorked}
                    onChange={(e) => setForm({ ...form, hoursWorked: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tasks Completed</label>
                <textarea
                  required
                  rows={4}
                  placeholder="List all tasks completed today (e.g. Created leads database model, configured express cors parameters...)"
                  value={form.tasksCompleted}
                  onChange={(e) => setForm({ ...form, tasksCompleted: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Challenges & Blockers (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Mention any issues or support needed..."
                  value={form.challenges}
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan for Next working Day (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="What will you work on tomorrow?"
                  value={form.nextDayPlan}
                  onChange={(e) => setForm({ ...form, nextDayPlan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button onClick={() => setIsSubmitOpen(false)} className="bg-slate-100 text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-white">
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
