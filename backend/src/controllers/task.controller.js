import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { CatalogItem } from '../models/CatalogItem.js';
import { Task } from '../models/Task.js';
import { TaskActivity } from '../models/TaskActivity.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasAccess } from '../middleware/auth.middleware.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

const STATUSES = ['Backlog', 'In Progress', 'In Review', 'Completed', 'On Hold'];
const PRIORITIES = ['High', 'Medium', 'Low'];
// Moving to any of these needs the dependency to be Completed first.
const STARTED = ['In Progress', 'In Review', 'Completed'];
const TZ = process.env.TASK_TZ || process.env.PAYROLL_TZ || 'Asia/Kolkata';

const PRIVATE_ROOT = path.resolve('private-storage', 'tasks');
const LEGACY_ROOT = path.resolve('storage', 'tasks');
const ATTACHMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.txt', '.log', '.json', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.zip']);
const MAX_ATTACHMENTS = 20;

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;
const sameId = (a, b) => String(a?._id || a || '') === String(b?._id || b || '');

function pickStatus(value) {
  const key = String(value ?? '').trim().toLowerCase();
  if (key === 'pending') return 'Backlog';
  const status = STATUSES.find((s) => s.toLowerCase() === key);
  if (!status) throw new ApiError(400, `"${String(value ?? '')}" is not a task status. Use: ${STATUSES.join(', ')}.`);
  return status;
}

function pickPriority(value) {
  const key = String(value ?? '').trim().toLowerCase();
  const priority = PRIORITIES.find((p) => p.toLowerCase() === key);
  if (!priority) throw new ApiError(400, 'Priority must be High, Medium or Low.');
  return priority;
}

function pickTitle(value) {
  const title = String(value ?? '').trim();
  if (!title) throw new ApiError(400, 'Task title is required.');
  if (title.length > 200) throw new ApiError(400, 'Task title can be at most 200 characters.');
  return title;
}

function pickHours(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0 || hours > 10000) throw new ApiError(400, 'Estimated hours must be a number from 0 to 10000.');
  return Math.round(hours * 100) / 100;
}

// Dates are calendar days: "2026-11-01" is stored as that day at 00:00 UTC.
function pickDueDate(value) {
  const raw = String(value ?? '').trim();
  const day = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
  const date = day ? new Date(`${day}T00:00:00.000Z`) : new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) throw new ApiError(400, 'Choose a valid due date.');
  return date;
}

function todayUtcMidnight() {
  const local = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return new Date(`${local}T00:00:00.000Z`);
}

function formatDay(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

/* ------------------------------------------------------------------ */
/* Access                                                              */
/* ------------------------------------------------------------------ */

/**
 * Managers (Full access on Tasks, or super admin) see and change every task.
 * Everyone else sees tasks in projects they are on, tasks assigned to them, and tasks they
 * created. Editing needs Tasks "Update"; the assignee may always move their own task's status.
 */
async function taskContext(user) {
  const [manager, projectsAll, canUpdate] = await Promise.all([
    hasAccess(user, 'tasks:delete'),
    hasAccess(user, 'catalog:delete'),
    hasAccess(user, 'tasks:update')
  ]);
  let myProjects = new Set();
  if (!manager && !projectsAll) {
    const projects = await CatalogItem.find({ $or: [{ 'assignedTeam.user': user._id }, { createdBy: user._id }] }).select('_id');
    myProjects = new Set(projects.map((p) => String(p._id)));
  }
  return { user, manager, projectsAll, canUpdate, myProjects };
}

const seesAll = (ctx) => ctx.manager || ctx.projectsAll;
const onProject = (ctx, projectId) => seesAll(ctx) || ctx.myProjects.has(String(projectId?._id || projectId));

function canView(ctx, task) {
  return seesAll(ctx) || sameId(task.assignee, ctx.user._id) || sameId(task.createdBy, ctx.user._id) || onProject(ctx, task.project);
}
const canEdit = (ctx, task) => ctx.canUpdate && canView(ctx, task);
const canMove = (ctx, task) => canEdit(ctx, task) || sameId(task.assignee, ctx.user._id);
const canDelete = (ctx, task) => ctx.manager || (ctx.canUpdate && sameId(task.createdBy, ctx.user._id));

async function loadVisibleTask(id, ctx) {
  if (!isId(id)) throw new ApiError(404, 'Task not found');
  const task = await Task.findById(id);
  if (!task || !canView(ctx, task)) throw new ApiError(404, 'Task not found');
  return task;
}

async function loadProject(projectId, ctx) {
  if (!isId(projectId)) throw new ApiError(400, 'Choose the project this task belongs to.');
  const project = await CatalogItem.findOne({ _id: projectId, type: 'project' }).select('title deadline projectStatus assignedTeam createdBy');
  if (!project) throw new ApiError(400, 'Project not found.');
  if (!onProject(ctx, project._id)) throw new ApiError(403, 'You can only add tasks to projects you are on.');
  return project;
}

function projectMemberIds(project) {
  const ids = new Set((project.assignedTeam || []).map((m) => String(m.user?._id || m.user)));
  if (project.createdBy) ids.add(String(project.createdBy));
  return ids;
}

// Assignee must be an active employee and, when the project has a team, on that team.
async function loadAssignee(assigneeId, project) {
  if (!isId(assigneeId)) throw new ApiError(400, 'Choose who the task is assigned to.');
  const user = await User.findOne({ _id: assigneeId, isActive: true, role: { $ne: 'customer' } }).select('name email role isActive phone');
  if (!user) throw new ApiError(400, 'Choose an active employee (customers and deactivated users can’t take tasks).');
  const members = projectMemberIds(project);
  if ((project.assignedTeam || []).length && !members.has(String(user._id))) {
    throw new ApiError(400, `${user.name} isn't on the "${project.title}" team. Add them to the project first.`);
  }
  return user;
}

// A dependency must be in the same project and must not lead back to this task.
async function loadDependency(dependencyId, projectId, taskId) {
  if (!isId(dependencyId)) throw new ApiError(400, 'Choose a valid dependency task.');
  if (taskId && sameId(dependencyId, taskId)) throw new ApiError(400, 'A task can’t depend on itself.');
  const dependency = await Task.findById(dependencyId).select('title project status dependency');
  if (!dependency) throw new ApiError(400, 'Dependency task not found.');
  if (!sameId(dependency.project, projectId)) throw new ApiError(400, 'The dependency must be in the same project.');
  if (taskId) {
    let cursor = dependency;
    for (let hops = 0; cursor?.dependency && hops < 100; hops += 1) {
      if (sameId(cursor.dependency, taskId)) throw new ApiError(400, `That would create a loop: "${dependency.title}" already depends on this task.`);
      cursor = await Task.findById(cursor.dependency).select('dependency');
    }
  }
  return dependency;
}

function assertDependencyDone(status, dependency) {
  if (dependency && STARTED.includes(status) && dependency.status !== 'Completed') {
    throw new ApiError(409, `Finish "${dependency.title}" first. This task can’t be ${status} until its dependency is Completed.`);
  }
}

function assertWithinProject(dueDate, project) {
  if (project?.deadline && dueDate > new Date(project.deadline)) {
    throw new ApiError(400, `Due date can’t be after the project deadline (${formatDay(project.deadline)}).`);
  }
}

/* ------------------------------------------------------------------ */
/* Attachments                                                         */
/* ------------------------------------------------------------------ */

function insideRoots(target) {
  const resolved = path.resolve(target);
  return [PRIVATE_ROOT, LEGACY_ROOT].some((root) => resolved.startsWith(root + path.sep));
}

function attachmentLocation(task, attachment) {
  // Files from before the fix are recorded as "/storage/tasks/<id>/<name>".
  const target = attachment.path?.startsWith('/storage/tasks/')
    ? path.join(LEGACY_ROOT, String(task._id), path.basename(attachment.path))
    : attachment.path;
  return target && insideRoots(target) ? path.resolve(target) : null;
}

function checkAttachments(files = []) {
  for (const file of files) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ATTACHMENT_EXTENSIONS.has(ext)) {
      throw new ApiError(400, `"${file.originalname}" isn't an allowed attachment type. Use documents, images, logs or ZIP.`);
    }
  }
}

async function writeAttachments(taskId, files, userId) {
  const dir = path.join(PRIVATE_ROOT, String(taskId));
  await fs.mkdir(dir, { recursive: true });
  const out = [];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'attachment';
    const filename = `${base}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${ext}`;
    const target = path.join(dir, filename);
    await fs.writeFile(target, file.buffer);
    out.push({
      filename,
      originalName: String(file.originalname).slice(0, 255),
      path: target,
      url: `/api/v1/tasks/${taskId}/attachments/${encodeURIComponent(filename)}`,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: userId
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Output, history, notifications                                      */
/* ------------------------------------------------------------------ */

async function present(task, ctx) {
  await Task.populate(task, [
    { path: 'project', select: 'title projectStatus deadline' },
    { path: 'assignee', select: 'name email role isActive' },
    { path: 'dependency', select: 'title status project' },
    { path: 'createdBy', select: 'name email role' }
  ]);
  const plain = typeof task.toObject === 'function' ? task.toObject() : { ...task };
  plain.attachments = (plain.attachments || []).map(({ path: _hidden, ...rest }) => ({
    ...rest,
    url: `/api/v1/tasks/${plain._id}/attachments/${encodeURIComponent(rest.filename)}`
  }));
  return { ...plain, canEdit: canEdit(ctx, task), canMove: canMove(ctx, task), canDelete: canDelete(ctx, task) };
}

async function log(taskId, user, action, message, metadata) {
  await TaskActivity.create({ task: taskId, actor: user?._id, action, message: `${user?.name || 'Someone'} ${message}`, metadata });
}

function notifyAssignee(assignee, task, project, { reassigned = false, actor = null } = {}) {
  if (!assignee?.phone) return;
  const message = `Hello *${assignee.name}*,\n\nYou have been assigned ${reassigned ? 'a task (reassigned)' : 'a new task'}: *${task.title}*.\n\n*Project:* ${project?.title || '-'}\n*Priority:* ${task.priority}\n*Due Date:* ${formatDay(task.dueDate)}\n*Description:* ${task.description || 'No description provided.'}\n\nPlease check your task dashboard.`;
  (async () => {
    let sent = null;
    if (actor?._id) sent = await sendWhatsAppMessage(String(actor._id), assignee.phone, message);
    if (!sent) await sendWhatsAppMessage(assignee.phone, message);
  })().catch((err) => console.error('Task WhatsApp notification failed:', err?.message || err));
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const listTasks = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 50), 100);

  const and = [];
  if (!seesAll(ctx)) {
    and.push({ $or: [{ assignee: ctx.user._id }, { createdBy: ctx.user._id }, { project: { $in: [...ctx.myProjects] } }] });
  }
  if (req.query.projectId) {
    if (!isId(req.query.projectId)) throw new ApiError(400, 'Unknown project filter.');
    and.push({ project: req.query.projectId });
  }
  if (req.query.assigneeId) {
    if (req.query.assigneeId === 'me') and.push({ assignee: ctx.user._id });
    else if (isId(req.query.assigneeId)) and.push({ assignee: req.query.assigneeId });
    else throw new ApiError(400, 'Unknown assignee filter.');
  }
  if (req.query.priority) and.push({ priority: pickPriority(req.query.priority) });
  if (req.query.status && req.query.status !== 'all') and.push({ status: pickStatus(req.query.status) });
  const filter = and.length ? { $and: and } : {};

  const [items, total] = await Promise.all([
    Task.find(filter).sort({ dueDate: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter)
  ]);
  const out = [];
  for (const item of items) out.push(await present(item, ctx));
  res.json({ items: out, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }, canCreate: ctx.canUpdate });
});

export const getTask = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const task = await loadVisibleTask(req.params.id, ctx);
  res.json(await present(task, ctx));
});

// People who can take a task in a project: its team (or all active staff when it has no team).
export const listTaskAssignees = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const project = await loadProject(req.query.projectId, ctx);
  const members = [...projectMemberIds(project)];
  const filter = { isActive: true, role: { $ne: 'customer' } };
  if ((project.assignedTeam || []).length) filter._id = { $in: members };
  const items = await User.find(filter).select('name email role').sort({ name: 1 });
  res.json({ items, teamOnly: (project.assignedTeam || []).length > 0 });
});

export const createTask = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const body = req.body || {};
  checkAttachments(req.files);

  const project = await loadProject(body.projectId || body.project, ctx);
  const assignee = await loadAssignee(body.assigneeId || body.assignee, project);
  const dueDate = pickDueDate(body.dueDate);
  if (dueDate < todayUtcMidnight()) throw new ApiError(400, 'Due date can’t be in the past.');
  assertWithinProject(dueDate, project);
  const status = body.status ? pickStatus(body.status) : 'Backlog';
  const dependency = body.dependencyId || body.dependency ? await loadDependency(body.dependencyId || body.dependency, project._id, null) : null;
  assertDependencyDone(status, dependency);

  const task = await Task.create({
    title: pickTitle(body.title),
    description: String(body.description ?? '').trim().slice(0, 10000),
    project: project._id,
    assignee: assignee._id,
    priority: body.priority ? pickPriority(body.priority) : 'Medium',
    status,
    dueDate,
    estimatedHours: pickHours(body.estimatedHours),
    dependency: dependency?._id || null,
    attachments: [],
    createdBy: req.user._id
  });

  if (req.files?.length) {
    try {
      task.attachments.push(...(await writeAttachments(task._id, req.files, req.user._id)));
      await task.save();
    } catch (err) {
      await Task.deleteOne({ _id: task._id });
      await fs.rm(path.join(PRIVATE_ROOT, String(task._id)), { recursive: true, force: true });
      throw err;
    }
  }

  await log(task._id, req.user, 'created', `created task "${task.title}"`, { title: task.title });
  notifyAssignee(assignee, task, project, { actor: req.user });
  res.status(201).json(await present(task, ctx));
});

/** Only the fields that are sent change. Empty description / dependency clears them. */
export const updateTask = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const task = await loadVisibleTask(req.params.id, ctx);
  if (!canEdit(ctx, task)) throw new ApiError(403, 'You can view this task but not edit it.');
  const body = req.body || {};
  checkAttachments(req.files);
  if ((task.attachments?.length || 0) + (req.files?.length || 0) > MAX_ATTACHMENTS) {
    throw new ApiError(400, `A task can have at most ${MAX_ATTACHMENTS} attachments.`);
  }

  const before = typeof task.toObject === 'function' ? task.toObject() : { ...task };
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  // Project
  let project = null;
  const projectInput = has('projectId') ? body.projectId : body.project;
  if (projectInput !== undefined && projectInput !== '' && !sameId(projectInput, task.project)) {
    project = await loadProject(projectInput, ctx);
    task.project = project._id;
  }
  const currentProject = project || await CatalogItem.findById(task.project).select('title deadline assignedTeam createdBy');

  if (has('title')) task.title = pickTitle(body.title);
  if (has('description')) task.description = String(body.description ?? '').trim().slice(0, 10000);
  if (has('estimatedHours')) task.estimatedHours = pickHours(body.estimatedHours);
  if (has('priority')) task.priority = pickPriority(body.priority);

  // Assignee: only checked when it changes, so tasks of people who left stay editable.
  const assigneeInput = has('assigneeId') ? body.assigneeId : body.assignee;
  let newAssignee = null;
  if (assigneeInput !== undefined && !sameId(assigneeInput, task.assignee)) {
    newAssignee = await loadAssignee(assigneeInput, currentProject);
    task.assignee = newAssignee._id;
  } else if (project && (project.assignedTeam || []).length && !projectMemberIds(project).has(String(task.assignee))) {
    throw new ApiError(400, 'The assignee isn’t on the new project’s team. Pick someone from that team.');
  }

  if (has('dueDate') && String(body.dueDate) !== '') {
    const due = pickDueDate(body.dueDate);
    if (due.getTime() !== new Date(task.dueDate).getTime()) {
      if (due < todayUtcMidnight()) throw new ApiError(400, 'Due date can’t be in the past.');
      task.dueDate = due;
    }
  }
  if (project || has('dueDate')) assertWithinProject(task.dueDate, currentProject);

  // Dependency: "" or null removes it.
  const depKey = has('dependencyId') ? 'dependencyId' : has('dependency') ? 'dependency' : null;
  let dependency = null;
  if (depKey) {
    const value = body[depKey];
    if (value === '' || value === null || value === 'null') task.dependency = null;
    else task.dependency = (dependency = await loadDependency(value, task.project, task._id))._id;
  } else if (project && task.dependency) {
    task.dependency = null; // a dependency can't point into another project
  }
  if (task.dependency && !dependency) dependency = await Task.findById(task.dependency).select('title status');

  if (has('status')) task.status = pickStatus(body.status);
  if (task.status !== before.status || !sameId(task.dependency, before.dependency)) assertDependencyDone(task.status, dependency);

  if (req.files?.length) task.attachments.push(...(await writeAttachments(task._id, req.files, req.user._id)));
  await task.save();

  // History
  const changes = [];
  if (before.title !== task.title) changes.push('title');
  if ((before.description || '') !== (task.description || '')) changes.push('description');
  if (Number(before.estimatedHours || 0) !== Number(task.estimatedHours || 0)) changes.push('estimate');
  if (changes.length) await log(task._id, req.user, 'edited', `changed ${changes.join(', ')}`, { changes });
  if (before.priority !== task.priority) await log(task._id, req.user, 'priority', `changed priority ${before.priority} → ${task.priority}`, { from: before.priority, to: task.priority });
  if (before.status !== task.status) await log(task._id, req.user, 'status', `moved the task ${before.status} → ${task.status}`, { from: before.status, to: task.status });
  if (!sameId(before.project, task.project)) await log(task._id, req.user, 'project', `moved the task to "${currentProject.title}"`, { from: before.project, to: task.project });
  if (newAssignee) await log(task._id, req.user, 'assignee', `reassigned the task to ${newAssignee.name}`, { from: before.assignee, to: task.assignee });
  if (new Date(before.dueDate).getTime() !== new Date(task.dueDate).getTime()) await log(task._id, req.user, 'dueDate', `changed the due date to ${formatDay(task.dueDate)}`, { from: before.dueDate, to: task.dueDate });
  if (!sameId(before.dependency, task.dependency)) await log(task._id, req.user, 'dependency', task.dependency ? `made it depend on "${dependency?.title}"` : 'removed the dependency', { from: before.dependency, to: task.dependency });
  if (req.files?.length) await log(task._id, req.user, 'attachment', `attached ${req.files.length} file(s)`, { files: req.files.map((f) => f.originalname) });

  if (newAssignee) notifyAssignee(newAssignee, task, currentProject, { reassigned: true, actor: req.user });
  res.json(await present(task, ctx));
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const task = await loadVisibleTask(req.params.id, ctx);
  if (!canMove(ctx, task)) throw new ApiError(403, 'Only the assignee or someone who can edit tasks can change the status.');
  const next = pickStatus(req.body?.status ?? req.body?.taskStatus);
  if (next !== task.status) {
    const dependency = task.dependency ? await Task.findById(task.dependency).select('title status') : null;
    assertDependencyDone(next, dependency);
    const previous = task.status;
    task.status = next;
    await task.save();
    await log(task._id, req.user, 'status', `moved the task ${previous} → ${next}`, { from: previous, to: next });
  }
  res.json(await present(task, ctx));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const task = await loadVisibleTask(req.params.id, ctx);
  if (!canDelete(ctx, task)) throw new ApiError(403, 'Only task managers or the person who created the task can delete it.');

  // Tasks that waited on this one no longer have a dependency.
  const dependents = await Task.find({ dependency: task._id }).select('_id title');
  for (const dep of dependents) {
    await Task.findByIdAndUpdate(dep._id, { $set: { dependency: null } });
    await log(dep._id, req.user, 'dependency', `deleted "${task.title}", so this task no longer depends on it`, { from: task._id, to: null });
  }
  await Task.deleteOne({ _id: task._id });
  await TaskActivity.deleteMany({ task: task._id });
  await fs.rm(path.join(PRIVATE_ROOT, String(task._id)), { recursive: true, force: true });
  await fs.rm(path.join(LEGACY_ROOT, String(task._id)), { recursive: true, force: true });
  res.json({ message: 'Task deleted.', unlinked: dependents.length });
});

export const downloadTaskAttachment = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const task = await loadVisibleTask(req.params.id, ctx);
  const attachment = (task.attachments || []).find((a) => a.filename === req.params.filename);
  const location = attachment && attachmentLocation(task, attachment);
  if (!location) throw new ApiError(404, 'Attachment not found');
  try {
    await fs.access(location);
  } catch {
    throw new ApiError(404, 'The file is missing on the server.');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(location, attachment.originalName || attachment.filename); // always a download, never rendered
});

export const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  const task = await loadVisibleTask(req.params.id, ctx);
  if (!canEdit(ctx, task)) throw new ApiError(403, 'You can view this task but not edit it.');
  const attachment = (task.attachments || []).find((a) => a.filename === req.params.filename);
  if (!attachment) throw new ApiError(404, 'Attachment not found');
  const location = attachmentLocation(task, attachment);
  task.attachments = task.attachments.filter((a) => a.filename !== attachment.filename);
  await task.save();
  if (location) await fs.rm(location, { force: true });
  await log(task._id, req.user, 'attachment', `removed attachment "${attachment.originalName || attachment.filename}"`, { file: attachment.filename });
  res.json(await present(task, ctx));
});

export const listTaskActivities = asyncHandler(async (req, res) => {
  const ctx = await taskContext(req.user);
  await loadVisibleTask(req.params.id, ctx);
  const activities = await TaskActivity.find({ task: req.params.id }).sort({ createdAt: -1 }).limit(200).populate('actor', 'name email role');
  res.json({ items: activities });
});
