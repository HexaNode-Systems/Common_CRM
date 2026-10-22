import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { AlertCircle, Download, Paperclip, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { downloadError, downloadFile } from '../utils/download.js';

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
// Due dates are calendar days stored at 00:00 UTC, so they are shown in UTC to avoid a day shift.
const dateFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

function formatDate(value) {
  if (!value) return '-';
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : '-';
}

function isOverdue(task) {
  if (!task?.dueDate || task.status === 'Completed') return false;
  // Overdue from the day after the due date.
  return new Date(task.dueDate).getTime() + 24 * 60 * 60 * 1000 < Date.now();
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

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEEDS_DEPENDENCY_DONE = ['In Progress', 'In Review', 'Completed'];
const ATTACHMENT_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'log', 'json', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'zip'];

function TaskSurface({ mode, task, projects, activities, saving, lookupsLoading, error, onClose, onSave, onStatusOnly, onDelete, onTaskChange }) {
  const [form, setForm] = useState(emptyTaskForm);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [teamOnly, setTeamOnly] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [localError, setLocalError] = useState('');
  const [busyFile, setBusyFile] = useState('');

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
    setLocalError('');
  }, [task, mode]);

  // People on the chosen project's team, and every task of that project (any status) for dependencies.
  useEffect(() => {
    if (!form.projectId) {
      setAssignees([]);
      setProjectTasks([]);
      return undefined;
    }
    let cancelled = false;
    api.get('/v1/tasks/assignees', { params: { projectId: form.projectId } })
      .then(({ data }) => { if (!cancelled) { setAssignees(data.items || []); setTeamOnly(Boolean(data.teamOnly)); } })
      .catch((err) => { if (!cancelled) { setAssignees([]); setLocalError(err.response?.data?.message || 'Unable to load the project team.'); } });
    api.get('/v1/tasks', { params: { projectId: form.projectId, status: 'all', limit: 100 } })
      .then(({ data }) => { if (!cancelled) setProjectTasks(data.items || []); })
      .catch(() => { if (!cancelled) setProjectTasks([]); });
    return () => { cancelled = true; };
  }, [form.projectId]);

  const readOnly = mode === 'edit' && task?.canEdit === false;
  const canMove = mode === 'create' || task?.canMove !== false;

  const dependencyOptions = useMemo(() => projectTasks.filter((item) => String(item._id) !== String(task?._id)), [projectTasks, task]);
  const selectedDependency = useMemo(
    () => dependencyOptions.find((item) => String(item._id) === String(form.dependencyId)) || (task?.dependency?._id && String(task.dependency._id) === String(form.dependencyId) ? task.dependency : null),
    [dependencyOptions, form.dependencyId, task]
  );
  const filteredUsers = useMemo(() => (
    assignees.filter((user) => [user.name, user.email, user.role].join(' ').toLowerCase().includes(assigneeQuery.toLowerCase()))
  ), [assignees, assigneeQuery]);
  // Keep the current assignee selectable even if they have since left the team or the company.
  const assigneeOptions = useMemo(() => {
    const list = filteredUsers.length ? filteredUsers : assignees;
    const current = task?.assignee;
    if (current?._id && !list.some((u) => String(u._id) === String(current._id))) return [{ ...current, left: true }, ...list];
    return list;
  }, [filteredUsers, assignees, task]);
  // Keep the task's own project selectable even if it is Finished or Blocked.
  const projectOptions = useMemo(() => {
    const current = task?.project;
    if (current?._id && !projects.some((p) => String(p._id) === String(current._id))) return [current, ...projects];
    return projects;
  }, [projects, task]);

  if (!mode) return null;

  const dependencyLocked = Boolean(selectedDependency && selectedDependency.status !== 'Completed');
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value, ...(field === 'projectId' ? { assigneeId: '', dependencyId: '' } : {}) }));

  function handleFiles(list) {
    const incoming = Array.from(list || []);
    const bad = incoming.find((f) => !ATTACHMENT_TYPES.includes(f.name.split('.').pop().toLowerCase()) || f.size > 10 * 1024 * 1024);
    if (bad) setLocalError(`"${bad.name}" can't be attached. Use documents, images, logs or ZIP up to 10 MB.`);
    setFiles((current) => [...current, ...incoming.filter((f) => f !== bad)].slice(0, 10));
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  async function downloadAttachment(att) {
    setBusyFile(att.filename);
    try {
      await downloadFile(`/v1/tasks/${task._id}/attachments/${encodeURIComponent(att.filename)}`, att.originalName || att.filename);
    } catch (err) {
      setLocalError(await downloadError(err));
    } finally {
      setBusyFile('');
    }
  }

  async function removeAttachment(att) {
    if (!window.confirm(`Remove "${att.originalName || att.filename}"?`)) return;
    setBusyFile(att.filename);
    try {
      const { data } = await api.delete(`/v1/tasks/${task._id}/attachments/${encodeURIComponent(att.filename)}`);
      onTaskChange(data);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Unable to remove the attachment.');
    } finally {
      setBusyFile('');
    }
  }

  function submit(event) {
    event.preventDefault();
    setLocalError('');
    if (readOnly) {
      if (canMove && form.status !== task.status) onStatusOnly(form.status);
      return;
    }
    if (NEEDS_DEPENDENCY_DONE.includes(form.status) && dependencyLocked) {
      setLocalError(`Finish "${selectedDependency.title}" first. This task can't be ${form.status} until its dependency is Completed.`);
      return;
    }
    const originalDue = task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '';
    if (form.dueDate && form.dueDate !== originalDue && form.dueDate < todayInput()) {
      setLocalError('Due date can’t be in the past.');
      return;
    }
    // Every field is sent, so clearing one (description, dependency, hours) really clears it.
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value == null ? '' : String(value)));
    files.forEach((file) => payload.append('attachments', file));
    onSave(payload, mode);
  }

  const shownError = localError || error;
  const attachments = task?.attachments || [];

  const content = (
    <form onSubmit={submit} className="flex h-full max-h-[92dvh] w-full min-w-0 flex-col sm:max-h-[88dvh]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-900">{mode === 'create' ? 'New Task' : readOnly ? task?.title : `Edit Task: ${task?.title || ''}`}</h2>
          <p className="mt-1 text-sm text-slate-500">{readOnly ? (canMove ? 'You can change the status of your task. Other details are view only.' : 'View only.') : 'Scope, project, owner, urgency and dependencies.'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        {shownError ? (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-theme border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{shownError}</span>
          </div>
        ) : null}
        <div className="grid gap-5">
          <fieldset disabled={readOnly} className="grid gap-5">
            <section className="rounded-theme border border-slate-200 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Task</h3>
              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Title *</span>
                  <input required maxLength={200} value={form.title} onChange={(e) => updateField('title', e.target.value)} className="input" placeholder="Task title" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
                  <textarea value={form.description} maxLength={10000} onChange={(e) => updateField('description', e.target.value)} className="input min-h-32" placeholder="Scope, checklist, links..." />
                </label>
              </div>
            </section>

            <section className="rounded-theme border border-slate-200 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Project & Owner</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Project *</span>
                  <select required value={form.projectId} onChange={(e) => updateField('projectId', e.target.value)} className="input">
                    <option value="">{lookupsLoading ? 'Loading projects...' : 'Select a project'}</option>
                    {projectOptions.map((p) => <option key={p._id} value={p._id}>{p.title} ({p.projectStatus})</option>)}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <label htmlFor="assignee-search" className="mb-1 block text-sm font-medium text-slate-700">Assignee *</label>
                  <input id="assignee-search" value={assigneeQuery} onChange={(e) => setAssigneeQuery(e.target.value)} className="input mb-2" placeholder="Search the team..." disabled={!form.projectId} />
                  <select aria-label="Select assignee" required value={form.assigneeId} onChange={(e) => updateField('assigneeId', e.target.value)} className="input" disabled={!form.projectId}>
                    <option value="">{form.projectId ? 'Select assignee' : 'Select a project first'}</option>
                    {assigneeOptions.map((user) => <option key={user._id} value={user._id}>{user.name} - {user.role}{user.left ? ' (no longer on the team)' : ''}</option>)}
                  </select>
                  {teamOnly ? <p className="mt-1 text-xs text-slate-500">Only people on this project's team are listed. Add someone to the project to assign them.</p> : null}
                </div>
              </div>
            </section>

            <section className="rounded-theme border border-slate-200 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Priority, Dates & Dependency</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2" role="radiogroup" aria-label="Priority">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Priority</span>
                  <div className="grid grid-cols-3 gap-3">
                    {PRIORITIES.map((priority) => (
                      <label key={priority} className={`cursor-pointer rounded-theme border p-3 text-center transition sm:text-left ${form.priority === priority ? 'border-primary bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="priority" className="sr-only" checked={form.priority === priority} onChange={() => updateField('priority', priority)} />
                        <div className="text-sm font-semibold text-slate-900">{priority}</div>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Due Date *</span>
                  <input required type="date" min={mode === 'create' ? todayInput() : undefined} value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} className="input" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Estimated Hours</span>
                  <input type="number" min="0" max="10000" step="0.5" value={form.estimatedHours} onChange={(e) => updateField('estimatedHours', e.target.value)} className="input" placeholder="4.5" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Depends on</span>
                  <select value={form.dependencyId} onChange={(e) => updateField('dependencyId', e.target.value)} className="input" disabled={!form.projectId}>
                    <option value="">No dependency</option>
                    {dependencyOptions.map((item) => <option key={item._id} value={item._id}>{item.title} ({item.status})</option>)}
                  </select>
                </label>
              </div>
            </section>
          </fieldset>

          <section className="rounded-theme border border-slate-200 p-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select value={form.status} disabled={readOnly && !canMove} onChange={(e) => updateField('status', e.target.value)} className="input">
                {STATUSES.map((status) => (
                  <option key={status} value={status} disabled={NEEDS_DEPENDENCY_DONE.includes(status) && dependencyLocked && status !== task?.status}>{status}</option>
                ))}
              </select>
              {dependencyLocked ? <p className="mt-1 text-xs text-amber-700">Waiting on "{selectedDependency.title}". In Progress, In Review and Completed unlock when it is Completed.</p> : null}
            </label>
          </section>

          <section className="rounded-theme border border-slate-200 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</h3>
            {attachments.length ? (
              <ul className="mb-3 divide-y divide-slate-100 rounded-theme border border-slate-200">
                {attachments.map((att) => (
                  <li key={att.filename} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-slate-700">{att.originalName || att.filename}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busyFile === att.filename} onClick={() => downloadAttachment(att)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"><Download size={13} />Download</button>
                      {!readOnly ? <button type="button" disabled={busyFile === att.filename} onClick={() => removeAttachment(att)} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label={`Remove ${att.originalName}`}><Trash2 size={13} /></button> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="mb-3 text-sm text-slate-500">No attachments yet.</p>}
            {!readOnly ? (
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDrop={handleDrop}
                className={`rounded-theme border-2 border-dashed p-4 text-center transition ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
              >
                <Paperclip size={20} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">Screenshots, logs or documents · up to 10 MB each</p>
                <input aria-label="Attach files" type="file" multiple accept={ATTACHMENT_TYPES.map((e) => `.${e}`).join(',')} onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} className="mt-3 block w-full text-sm text-slate-500" />
              </div>
            ) : null}
            {files.length ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                    <span className="break-all">{file.name}</span>
                    <button type="button" onClick={() => setFiles((cur) => cur.filter((_, i) => i !== index))} className="text-xs font-semibold text-slate-500 hover:text-red-600">Remove</button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {mode === 'edit' ? (
            <section className="rounded-theme border border-slate-200 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</h3>
              {activities.length ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity._id} className="rounded-theme bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">{activity.message}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(activity.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No activity yet.</p>}
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          {mode === 'edit' && task?.canDelete ? (
            <Button type="button" variant="outline" onClick={onDelete} className="gap-2 text-red-600"><Trash2 size={15} />Delete task</Button>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>{readOnly && !canMove ? 'Close' : 'Cancel'}</Button>
          {!readOnly || canMove ? (
            <Button type="submit" disabled={saving || (readOnly && form.status === task?.status)}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create Task' : readOnly ? 'Update Status' : 'Save Changes'}
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );

  if (mode === 'create') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4">
        <button type="button" className="absolute inset-0 cursor-default" aria-label="Close task modal" onClick={onClose} />
        <div className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-t-theme bg-white shadow-2xl sm:rounded-theme">{content}</div>
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
  const { user } = useAuth();
  const perms = user?.permissions || [];
  // The server lets "Update" access create tasks too.
  const canCreate = user?.role === 'super_admin' || perms.includes('tasks:create') || perms.includes('tasks:update');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [surfaceError, setSurfaceError] = useState('');
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

  // Projects are only for the dropdowns. They load AFTER the tasks are shown,
  // so they do not compete with the tasks request on slow mobile networks.
  async function loadLookups() {
    if (lookupsStarted.current) return;
    lookupsStarted.current = true;
    setLookupsLoading(true);
    try {
      // Only your projects; assignees are loaded per project inside the form.
      const projectRes = await api.get('/catalog', { params: { limit: 200 } });
      setProjects((projectRes.data.items || []).filter((item) => ['Pipeline', 'Running'].includes(item.projectStatus)));
    } catch {
      lookupsStarted.current = false; // allow a retry
      setError('Unable to load projects.');
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

  async function loadActivities(taskId) {
    try {
      const { data } = await api.get(`/v1/tasks/${taskId}/activities`);
      setActivities(data.items || []);
    } catch {
      setActivities([]);
    }
  }

  async function openEdit(task) {
    loadLookups();
    setSurfaceError('');
    setSurfaceState({ mode: 'edit', task });
    loadActivities(task._id);
  }

  // After an attachment is removed: show the fresh task and its history.
  function replaceTask(next) {
    setSurfaceState((current) => ({ ...current, task: next }));
    setTasks((list) => list.map((item) => (item._id === next._id ? next : item)));
    loadActivities(next._id);
  }

  async function changeStatusOnly(status) {
    setSurfaceSaving(true);
    setSurfaceError('');
    try {
      await api.patch(`/v1/tasks/${surfaceState.task._id}/status`, { status });
      closeSurface();
      loadTasks({ page: 1 });
    } catch (err) {
      setSurfaceError(err.response?.data?.message || 'Unable to change the status.');
    } finally {
      setSurfaceSaving(false);
    }
  }

  async function deleteTask() {
    const task = surfaceState.task;
    if (!task || !window.confirm(`Delete "${task.title}" and its attachments permanently?`)) return;
    setSurfaceSaving(true);
    setSurfaceError('');
    try {
      await api.delete(`/v1/tasks/${task._id}`);
      closeSurface();
      loadTasks({ page: 1 });
    } catch (err) {
      setSurfaceError(err.response?.data?.message || 'Unable to delete the task.');
    } finally {
      setSurfaceSaving(false);
    }
  }

  function openCreate() {
    setSurfaceError('');
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
    setSurfaceError('');
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
      setSurfaceError(err.response?.data?.message || 'Unable to save task.');
    } finally {
      setSurfaceSaving(false);
    }
  }

  // People who appear on the loaded tasks (no Users access needed).
  const assigneeFilterOptions = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => { if (t.assignee?._id) map.set(String(t.assignee._id), t.assignee); });
    return [...map.values()].sort((x, y) => String(x.name).localeCompare(String(y.name)));
  }, [tasks]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        label="Work"
        title="Task Management"
        description="Track work by project, assignee, priority, and lifecycle state."
        className=""
        actions={
          <>
            <Button variant="outline" onClick={() => loadTasks({ page: 1 })} className="gap-2">
              <RefreshCw size={15} /> Refresh
            </Button>
            {canCreate ? (
              <Button onClick={openCreate} className="gap-2">
                <Plus size={15} /> Add New
              </Button>
            ) : null}
          </>
        }
      />

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
              <option value="me">Assigned to me</option>
              {assigneeFilterOptions.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}
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
                    <button type="button" onClick={() => openEdit(task)} className="min-h-[40px] rounded-theme px-3 text-sm font-semibold text-primary hover:bg-slate-50">{task.canEdit === false ? 'View' : 'Edit'}</button>
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
                        <button type="button" onClick={() => openEdit(task)} className="font-semibold text-primary transition hover:underline">{task.canEdit === false ? 'View' : 'Edit'}</button>
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
          activities={activities}
          saving={surfaceSaving}
          lookupsLoading={lookupsLoading}
          error={surfaceError}
          onClose={closeSurface}
          onSave={saveTask}
          onStatusOnly={changeStatusOnly}
          onDelete={deleteTask}
          onTaskChange={replaceTask}
        />
      ) : null}
    </div>
  );
}