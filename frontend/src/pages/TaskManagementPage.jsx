import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { AlertCircle, Paperclip, Plus, RefreshCw, X } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Backlog', 'In Progress', 'In Review', 'Completed', 'On Hold'];
const PAGE_SIZE = 30; // load 30 tasks at a time instead of 100

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

// Create the date formatter once (not on every row)
const dateFormatter = new Intl.DateTimeFormat('en-GB');

function formatDate(value) {
  if (!value) return '-';
  return dateFormatter.format(new Date(value));
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

/* ---------- Task create / edit form ---------- */

function TaskSurface({ mode, task, projects, users, tasks, activities, saving, lookupsLoading, onClose, onSave }) {
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
    // Block "In Progress" while the dependency is not completed
    if (form.status === 'In Progress' && selectedDependency && selectedDependency.status !== 'Completed') {
      return;
    }
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value != null) payload.append(key, String(value));
    });
    files.forEach((file) => payload.append('attachments', file));
    onSave(payload, mode);
  }

  const dependencyLocked = Boolean(selectedDependency && selectedDependency.status !== 'Completed');
  const assigneeOptions = filteredUsers.length ? filteredUsers : users;

  const content = (
    <form onSubmit={submit} className="flex h-full max-h-[92dvh] w-full min-w-0 flex-col sm:max-h-[88dvh]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-900">{mode === 'create' ? '+ Add New Task' : `Edit Task: ${task?.title || ''}`}</h2>
          <p className="mt-1 text-sm text-slate-500">Define scope, project linkage, ownership, urgency, and dependencies.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
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
                  <option value="">{lookupsLoading ? 'Loading projects...' : 'Select a project'}</option>
                  {projects.map((projectItem) => (
                    <option key={projectItem._id} value={projectItem._id}>{projectItem.title} ({projectItem.projectStatus})</option>
                  ))}
                </select>
              </label>

              <div className="sm:col-span-2">
                <label htmlFor="assignee-search" className="mb-1 block text-sm font-medium text-slate-700">Assignee</label>
                <input id="assignee-search" value={assigneeQuery} onChange={(e) => setAssigneeQuery(e.target.value)} className="input mb-2" placeholder="Search active users..." />
                <select aria-label="Select assignee" required value={form.assigneeId} onChange={(e) => updateField('assigneeId', e.target.value)} className="input">
                  <option value="">{lookupsLoading ? 'Loading users...' : 'Select active assignee'}</option>
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
              <div className="sm:col-span-2 lg:col-span-3" role="radiogroup" aria-label="Priority">
                <span className="mb-2 block text-sm font-medium text-slate-700">Priority Matrix</span>
                <div className="grid grid-cols-3 gap-3">
                  {PRIORITIES.map((priority) => (
                    <label key={priority} className={`cursor-pointer rounded-2xl border p-3 text-center transition sm:text-left ${form.priority === priority ? 'border-primary bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
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
              className={`rounded-2xl border-2 border-dashed p-4 text-center transition sm:p-5 ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <Paperclip size={20} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-700">Add design screenshots, bug logs, or reference docs</p>
              <input aria-label="Attach files" type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-3 block w-full text-sm text-slate-500" />
            </div>
            {files.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {files.map((file, index) => <li key={`${file.name}-${index}`} className="break-all">• {file.name}</li>)}
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

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-5">
        <button type="button" onClick={onClose} className="rounded-theme border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
        <Button type="submit" disabled={saving} className="px-4 py-2.5">{saving ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}</Button>
      </div>
    </form>
  );

  // Create: bottom sheet on phones, centered modal on larger screens
  if (mode === 'create') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4">
        <button type="button" className="absolute inset-0 cursor-default" aria-label="Close task modal" onClick={onClose} />
        <div className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">{content}</div>
      </div>
    );
  }

  // Edit: side drawer (full width on phones)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close task drawer" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">{content}</aside>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
      {initials(name)}
    </div>
  );
}

// Placeholder shown while tasks load
function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-100 p-4">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ projectId: '', assigneeId: '', priority: '' });
  const [statusTab, setStatusTab] = useState('Backlog');
  const [surfaceState, setSurfaceState] = useState({ mode: null, task: null });
  const [surfaceSaving, setSurfaceSaving] = useState(false);
  const [activities, setActivities] = useState([]);

  const requestId = useRef(0);      // ignore old responses
  const pageRef = useRef(1);        // current page number
  const tasksRef = useRef([]);      // latest tasks (used to avoid duplicates)
  const lookupsStarted = useRef(false);
  const firstRun = useRef(true);

  tasksRef.current = tasks;

  // Projects and users are only for the dropdowns. They load AFTER the tasks are shown,
  // so they do not compete with the tasks request on slow mobile networks.
  async function loadLookups() {
    if (lookupsStarted.current) return;
    lookupsStarted.current = true;
    setLookupsLoading(true);
    try {
      const [projectRes, userRes] = await Promise.all([
        api.get('/catalog', { params: { limit: 200 } }),
        api.get('/v1/users', { params: { limit: 200 } })
      ]);
      setProjects((projectRes.data.items || []).filter((item) => ['Pipeline', 'Running'].includes(item.projectStatus)));
      setUsers((userRes.data.items || []).filter((item) => item.isActive));
    } catch {
      lookupsStarted.current = false; // allow a retry
      setError('Unable to load projects or users.');
    } finally {
      setLookupsLoading(false);
    }
  }

  const loadTasks = useCallback(async ({ page = 1, append = false } = {}) => {
    const current = ++requestId.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const params = { limit: PAGE_SIZE, page };
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;
      if (filters.priority) params.priority = filters.priority;
      if (statusTab) params.status = statusTab;

      const { data } = await api.get('/v1/tasks', { params });
      if (current !== requestId.current) return; // a newer request started

      const next = data.items || [];
      if (append) {
        const known = new Set(tasksRef.current.map((item) => item._id));
        const fresh = next.filter((item) => !known.has(item._id));
        setTasks((list) => [...list, ...fresh]);
        // If the server sent nothing new, there is no more data
        setHasMore(next.length === PAGE_SIZE && fresh.length > 0);
      } else {
        setTasks(next);
        setHasMore(next.length === PAGE_SIZE);
      }
      pageRef.current = page;
    } catch (err) {
      if (current !== requestId.current) return;
      setError(err.response?.data?.message || 'Unable to load tasks.');
    } finally {
      if (current === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filters, statusTab]);

  // Load tasks. First load starts immediately; later filter changes wait 200 ms.
  useEffect(() => {
    const delay = firstRun.current ? 0 : 200;
    firstRun.current = false;
    const timer = window.setTimeout(() => loadTasks({ page: 1 }), delay);
    return () => window.clearTimeout(timer);
  }, [loadTasks]);

  // Start loading dropdown data once the first tasks request has finished
  useEffect(() => {
    if (!loading) loadLookups();
  }, [loading]);

  async function openEdit(task) {
    loadLookups();
    setSurfaceState({ mode: 'edit', task });
    try {
      const { data } = await api.get(`/v1/tasks/${task._id}/activities`);
      setActivities(data.items || []);
    } catch {
      setActivities([]);
    }
  }

  function openCreate() {
    loadLookups();
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
      if (mode === 'create') {
        await api.post('/v1/tasks', payload, config);
      } else {
        await api.put(`/v1/tasks/${surfaceState.task._id}`, payload, config);
      }
      closeSurface();
      // One reload keeps the list correct (a task may move to another status tab)
      loadTasks({ page: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save task.');
    } finally {
      setSurfaceSaving(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Task Management</h1>
          <p className="mt-1 text-sm text-slate-600">Track work by project, assignee, priority, and lifecycle state.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button onClick={() => loadTasks({ page: 1 })} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 sm:flex-none">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={openCreate} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 sm:flex-none">
            <Plus size={16} /> Add New
          </Button>
        </div>
      </div>

      <Card className="space-y-4">
        {/* Every dropdown has a label. sr-only means only screen readers see the text. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="filter-project" className="sr-only">Filter by project</label>
            <select id="filter-project" className="input" value={filters.projectId} onChange={(e) => setFilters((current) => ({ ...current, projectId: e.target.value }))}>
              <option value="">All Projects</option>
              {projects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-assignee" className="sr-only">Filter by assignee</label>
            <select id="filter-assignee" className="input" value={filters.assigneeId} onChange={(e) => setFilters((current) => ({ ...current, assigneeId: e.target.value }))}>
              <option value="">All Assignees</option>
              {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="filter-priority" className="sr-only">Filter by priority</label>
            <select id="filter-priority" className="input" value={filters.priority} onChange={(e) => setFilters((current) => ({ ...current, priority: e.target.value }))}>
              <option value="">All Priorities</option>
              {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
        </div>

        {/* Status tabs: scroll sideways on small screens */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter by status">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusTab === status}
              onClick={() => setStatusTab(status)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${statusTab === status ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? <LoadingSkeleton /> : null}

        {!loading && tasks.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500">No tasks found.</p>
        ) : null}

        {/* Phones and small tablets: one card per task */}
        {!loading && tasks.length > 0 ? (
          <ul className="space-y-3 p-3 md:hidden">
            {tasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <li key={task._id} className="rounded-xl border border-slate-200 p-4">
                  <p className="break-words font-semibold text-slate-900">{task.title}</p>
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{getProjectLabel(task.project)}</span>

                  <div className="mt-3 flex items-center gap-3">
                    <Avatar name={task.assignee?.name || 'Unassigned'} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{task.assignee?.name || 'Unassigned'}</p>
                      <p className="truncate text-xs text-slate-500">{task.assignee?.role || task.assignee?.roleLabel || ''}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(task.priority)}`}>{task.priority}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(task.status)}`}>{task.status}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                      Due {formatDate(task.dueDate)} {overdue ? '(Overdue)' : ''}
                    </span>
                    <button type="button" onClick={() => openEdit(task)} className="min-h-[40px] rounded-theme px-3 text-sm font-semibold text-primary hover:bg-slate-50">Edit</button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* Tablets and desktops: full table */}
        {!loading && tasks.length > 0 ? (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Task Title & Parent Project</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Assignee</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Priority & Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700">Target Due Date</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
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
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && hasMore ? (
          <div className="border-t border-slate-100 p-4 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => loadTasks({ page: pageRef.current + 1, append: true })}
              className="rounded-theme border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        ) : null}
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
          lookupsLoading={lookupsLoading}
          onClose={closeSurface}
          onSave={saveTask}
        />
      ) : null}
    </div>
  );
}