import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Paperclip, Plus, RefreshCw, Search, X, ChevronDown, KanbanSquare, CircleCheckBig, Clock3, TimerReset } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Backlog', 'In Progress', 'In Review', 'Completed', 'On Hold'];

const emptyTaskForm = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'Medium',
  status: 'Backlog',
  dueDate: '',
  estimatedHours: '',
  dependencyId: ''
};

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB').format(new Date(value));
}

function isOverdue(task) {
  if (!task?.dueDate || task.status === 'Completed') return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function getPriorityClasses(priority) {
  const styles = {
    High: 'bg-red-50 text-red-700 border border-red-200',
    Medium: 'bg-orange-50 text-orange-700 border border-orange-200',
    Low: 'bg-blue-50 text-blue-700 border border-blue-200'
  };
  return styles[priority] || styles.Medium;
}

function getStatusClasses(status) {
  const styles = {
    Backlog: 'bg-slate-100 text-slate-700 border border-slate-200',
    'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
    'In Review': 'bg-amber-50 text-amber-700 border border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'On Hold': 'bg-rose-50 text-rose-700 border border-rose-200'
  };
  return styles[status] || styles.Backlog;
}

function initials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function getProjectLabel(project) {
  if (!project) return '-';
  return project.title || project.name || '-';
}

function TaskSurface({ mode, task, projects, users, tasks, activities, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyTaskForm);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [showDependencyNote, setShowDependencyNote] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        projectId: task.project?._id || task.project || '',
        assigneeId: task.assignee?._id || task.assignee || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Backlog',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        estimatedHours: task.estimatedHours ?? '',
        dependencyId: task.dependency?._id || task.dependency || ''
      });
    } else {
      setForm({ ...emptyTaskForm });
    }
    setFiles([]);
    setAssigneeQuery('');
  }, [task, mode]);

  const selectedProject = useMemo(() => projects.find((projectItem) => String(projectItem._id) === String(form.projectId)), [projects, form.projectId]);
  const dependencyOptions = useMemo(() => (
    tasks.filter((item) => String(item.project?._id || item.project) === String(form.projectId) && String(item._id) !== String(task?._id))
  ), [tasks, form.projectId, task]);
  const filteredUsers = useMemo(() => (
    users.filter((user) => [user.name, user.email, user.roleLabel, user.role].join(' ').toLowerCase().includes(assigneeQuery.toLowerCase()))
  ), [users, assigneeQuery]);
  const selectedDependency = useMemo(() => dependencyOptions.find((item) => String(item._id) === String(form.dependencyId)), [dependencyOptions, form.dependencyId]);

  useEffect(() => {
    setShowDependencyNote(Boolean(form.dependencyId) && form.status === 'In Progress');
  }, [form.dependencyId, form.status]);

  if (!mode) return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFiles(list) {
    setFiles((current) => [...current, ...Array.from(list || [])]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value != null) payload.append(key, String(value));
    });
    files.forEach((file) => payload.append('attachments', file));
    if (form.status === 'In Progress' && selectedDependency && selectedDependency.status !== 'Completed') {
      return;
    }
    onSave(payload, mode);
  }

  const dependencyLocked = Boolean(selectedDependency && selectedDependency.status !== 'Completed');
  const assigneeOptions = filteredUsers.length ? filteredUsers : users;

  const content = (
    <form onSubmit={submit} className="flex h-full max-h-[88vh] flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{mode === 'create' ? '+ Add New Task' : `Edit Task: ${task?.title || ''}`}</h2>
          <p className="mt-1 text-sm text-slate-500">Define scope, project linkage, ownership, urgency, and dependencies.</p>
        </div>
        <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="grid gap-5">
          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Core Content & Scope</h3>
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Task Title</span>
                <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className="input" placeholder="Task title" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="input min-h-36"
                  placeholder="Markdown supported: scope, checklist items, technical expectations, links..."
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ownership & Linking Logic</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Parent Project</span>
                <select required value={form.projectId} onChange={(e) => updateField('projectId', e.target.value)} className="input">
                  <option value="">Select a project</option>
                  {projects.map((projectItem) => (
                    <option key={projectItem._id} value={projectItem._id}>{projectItem.title} ({projectItem.projectStatus})</option>
                  ))}
                </select>
              </label>

              <div className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Assignee</span>
                <input value={assigneeQuery} onChange={(e) => setAssigneeQuery(e.target.value)} className="input mb-2" placeholder="Search active users..." />
                <select required value={form.assigneeId} onChange={(e) => updateField('assigneeId', e.target.value)} className="input">
                  <option value="">Select active assignee</option>
                  {assigneeOptions.map((user) => (
                    <option key={user._id} value={user._id}>{user.name} - {user.roleLabel || user.role}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Urgency & Parameters</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="mb-2 block text-sm font-medium text-slate-700">Priority Matrix</span>
                <div className="grid grid-cols-3 gap-3">
                  {PRIORITIES.map((priority) => (
                    <label key={priority} className={`cursor-pointer rounded-2xl border p-3 transition ${form.priority === priority ? 'border-primary bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="priority" className="sr-only" checked={form.priority === priority} onChange={() => updateField('priority', priority)} />
                      <div className="text-sm font-semibold text-slate-900">{priority}</div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Task Status</span>
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className="input">
                  {STATUSES.map((status) => (
                    <option key={status} value={status} disabled={status === 'In Progress' && dependencyLocked}>{status}</option>
                  ))}
                </select>
                {dependencyLocked ? <p className="mt-1 text-xs text-amber-700">Dependency is not complete, so In Progress is locked.</p> : null}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Target Due Date</span>
                <input required type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} className="input" />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Estimated Hours</span>
                <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => updateField('estimatedHours', e.target.value)} className="input" placeholder="4.5" />
              </label>

              <label className="block sm:col-span-2 lg:col-span-3">
                <span className="mb-1 block text-sm font-medium text-slate-700">Dependency Mapping</span>
                <select value={form.dependencyId} onChange={(e) => updateField('dependencyId', e.target.value)} className="input">
                  <option value="">No dependency</option>
                  {form.projectId ? dependencyOptions.map((item) => (
                    <option key={item._id} value={item._id}>Depends on {item.title} ({item.status})</option>
                  )) : <option value="">Select a project first</option>}
                </select>
                {showDependencyNote ? <p className="mt-1 text-xs text-amber-700">This task is blocked until the dependency reaches Completed.</p> : null}
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">File Attachments</h3>
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <Paperclip size={20} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-700">Drag and drop design screenshots, bug logs, or reference docs</p>
              <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-3 block w-full text-sm text-slate-500" />
            </div>
            {files.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {files.map((file, index) => <li key={`${file.name}-${index}`}>• {file.name}</li>)}
              </ul>
            ) : null}
          </section>

          {mode === 'edit' ? (
            <section className="rounded-2xl border border-slate-200 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Activity Timeline</h3>
              {activities.length ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">{activity.message}</p>
                      <p className="text-xs text-slate-500">{activity.actor?.name || 'System'} • {formatDate(activity.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No activity yet.</p>}
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
        <Button type="submit" disabled={saving} className="px-4 py-2">{saving ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}</Button>
      </div>
    </form>
  );

  if (mode === 'create') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
        <button type="button" className="absolute inset-0 cursor-default" aria-label="Close task modal" onClick={onClose} />
        <div className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">{content}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close task drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">{content}</aside>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
      {initials(name)}
    </div>
  );
}

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ projectId: '', assigneeId: '', priority: '' });
  const [statusTab, setStatusTab] = useState('Backlog');
  const [surfaceState, setSurfaceState] = useState({ mode: null, task: null });
  const [surfaceSaving, setSurfaceSaving] = useState(false);
  const [activities, setActivities] = useState([]);

  async function loadLookups() {
    const [projectRes, userRes] = await Promise.all([
      api.get('/catalog', { params: { limit: 200 } }),
      api.get('/v1/users', { params: { limit: 200 } })
    ]);

    setProjects((projectRes.data.items || []).filter((item) => ['Pipeline', 'Running'].includes(item.projectStatus)));
    setUsers((userRes.data.items || []).filter((item) => item.isActive));
  }

  async function loadTasks(nextFilters = filters, nextStatus = statusTab) {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (nextFilters.projectId) params.projectId = nextFilters.projectId;
      if (nextFilters.assigneeId) params.assigneeId = nextFilters.assigneeId;
      if (nextFilters.priority) params.priority = nextFilters.priority;
      if (nextStatus) params.status = nextStatus;
      const { data } = await api.get('/v1/tasks', { params });
      setTasks(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups().catch(() => setError('Unable to load projects or users.'));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadTasks(filters, statusTab), 200);
    return () => window.clearTimeout(timer);
  }, [filters, statusTab]);

  async function openEdit(task) {
    setSurfaceState({ mode: 'edit', task });
    try {
      const { data } = await api.get(`/v1/tasks/${task._id}/activities`);
      setActivities(data.items || []);
    } catch {
      setActivities([]);
    }
  }

  function openCreate() {
    setSurfaceState({ mode: 'create', task: null });
    setActivities([]);
  }

  function closeSurface() {
    setSurfaceState({ mode: null, task: null });
    setActivities([]);
  }

  async function saveTask(payload, mode) {
    setSurfaceSaving(true);
    setError('');
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = mode === 'create'
        ? await api.post('/v1/tasks', payload, config)
        : await api.put(`/v1/tasks/${surfaceState.task._id}`, payload, config);

      if (mode === 'create') {
        setTasks((current) => [data, ...current]);
      } else {
        setTasks((current) => current.map((item) => (item._id === data._id ? data : item)));
        const activityRes = await api.get(`/v1/tasks/${data._id}/activities`);
        setActivities(activityRes.data.items || []);
      }
      closeSurface();
      await loadTasks(filters, statusTab);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save task.');
    } finally {
      setSurfaceSaving(false);
    }
  }

  const filteredTasks = useMemo(() => tasks, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Task Management</h1>
          <p className="mt-1 text-sm text-slate-600">Track work by project, assignee, priority, and lifecycle state.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => loadTasks(filters, statusTab)} className="inline-flex items-center gap-2 px-4 py-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2">
            <Plus size={16} /> Add New
          </Button>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <select className="input" value={filters.projectId} onChange={(e) => setFilters((current) => ({ ...current, projectId: e.target.value }))}>
            <option value="">All Projects</option>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}
          </select>
          <select className="input" value={filters.assigneeId} onChange={(e) => setFilters((current) => ({ ...current, assigneeId: e.target.value }))}>
            <option value="">All Assignees</option>
            {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
          </select>
          <select className="input" value={filters.priority} onChange={(e) => setFilters((current) => ({ ...current, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 p-1">
            {STATUSES.map((status) => (
              <button key={status} type="button" onClick={() => setStatusTab(status)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${statusTab === status ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700">Task Title & Parent Project</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Assignee</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Priority & Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Target Due Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="5">Loading tasks...</td></tr>
              ) : filteredTasks.length ? (
                filteredTasks.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{getProjectLabel(task.project)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={task.assignee?.name || 'Unassigned'} />
                          <div>
                            <p className="font-medium text-slate-900">{task.assignee?.name || 'Unassigned'}</p>
                            <p className="text-xs text-slate-500">{task.assignee?.role || task.assignee?.roleLabel || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(task.priority)}`}>{task.priority}</span>
                          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(task.status)}`}>{task.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                          {formatDate(task.dueDate)} {overdue ? 'Overdue' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button type="button" onClick={() => openEdit(task)} className="font-semibold text-primary transition hover:underline">Edit</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="px-4 py-12 text-center text-slate-500" colSpan="5">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {surfaceState.mode ? (
        <TaskSurface
          mode={surfaceState.mode}
          task={surfaceState.task}
          projects={projects}
          users={users}
          tasks={tasks}
          activities={activities}
          saving={surfaceSaving}
          onClose={closeSurface}
          onSave={saveTask}
        />
      ) : null}
    </div>
  );
}
