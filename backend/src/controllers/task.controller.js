import fs from 'fs/promises';
import path from 'path';
import { CatalogItem } from '../models/CatalogItem.js';
import { Task } from '../models/Task.js';
import { TaskActivity } from '../models/TaskActivity.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

const taskStatuses = ['Backlog', 'In Progress', 'In Review', 'Completed', 'On Hold'];
const taskPriorities = ['High', 'Medium', 'Low'];

function parseDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeStatus(value) {
  const status = String(value || '').trim();
  if (status === 'Pending') return 'Backlog';
  return taskStatuses.includes(status) ? status : 'Backlog';
}

function normalizePriority(value) {
  const priority = String(value || '').trim();
  return taskPriorities.includes(priority) ? priority : 'Medium';
}

function parseMaybeJson(value) {
  if (value == null || value === '') return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function safeFilename(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'attachment';
  return `${base}-${Date.now()}${ext}`;
}

async function writeAttachments(taskId, files = []) {
  if (!files.length) return [];

  const attachments = [];
  for (const file of files) {
    const filename = safeFilename(file.originalname);
    const relativeDir = path.join('storage', 'tasks', String(taskId));
    const absoluteDir = path.resolve(relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(path.join(absoluteDir, filename), file.buffer);

    attachments.push({
      filename,
      originalName: file.originalname,
      path: `/storage/tasks/${taskId}/${filename}`,
      url: `/storage/tasks/${taskId}/${filename}`, 
      mimetype: file.mimetype,
      size: file.size
    });
  }

  return attachments;
}

async function loadProject(projectId) {
  const project = await CatalogItem.findOne({ _id: projectId, type: 'project' });
  if (!project) throw new ApiError(400, 'Parent project is required.');
  return project;
}

async function loadActiveAssignee(assigneeId) {
  const assignee = await User.findOne({ _id: assigneeId, isActive: true }).select('name email role isActive phone');
  if (!assignee) throw new ApiError(400, 'Select an active assignee from the workspace users list.');
  return assignee;
}

async function loadDependency(dependencyId, projectId, taskId = null) {
  if (!dependencyId) return null;
  if (String(dependencyId) === String(taskId)) throw new ApiError(400, 'A task cannot depend on itself.');

  const dependency = await Task.findById(dependencyId).select('title project status');
  if (!dependency) throw new ApiError(400, 'Selected dependency task was not found.');
  if (String(dependency.project) !== String(projectId)) throw new ApiError(400, 'Dependency task must belong to the same project.');
  return dependency;
}

function buildTaskFilter(req) {
  const filter = {};
  if (req.query.projectId) filter.project = req.query.projectId;
  if (req.query.assigneeId) filter.assignee = req.query.assigneeId;
  if (req.query.priority) filter.priority = normalizePriority(req.query.priority);
  if (req.query.status) filter.status = normalizeStatus(req.query.status);
  return filter;
}

async function logTaskActivity({ taskId, actorId, action, message, metadata }) {
  await TaskActivity.create({ task: taskId, actor: actorId, action, message, metadata });
}

async function populateTask(task) {
  return task
    .populate('project', 'title projectStatus deadline')
    .populate('assignee', 'name email role isActive')
    .populate('dependency', 'title status project')
    .populate('createdBy', 'name email role');
}

function buildTaskPayload(body, { existingTask = null, project = null, assignee = null, dependency = null } = {}) {
  const title = String(body.title || existingTask?.title || '').trim();
  if (!title) throw new ApiError(400, 'Task title is required.');

  const dueDate = parseDate(body.dueDate) ?? existingTask?.dueDate;
  if (!dueDate) throw new ApiError(400, 'Target due date is required.');

  const description = String(body.description || '').trim();
  const estimatedHours = Number(body.estimatedHours || 0);
  const status = normalizeStatus(body.status || existingTask?.status);
  const priority = normalizePriority(body.priority || existingTask?.priority);

  if (project?.deadline && dueDate > project.deadline) {
    throw new ApiError(400, 'Task deadline cannot extend past the core Project deadline.');
  }

  if (dependency && status === 'In Progress' && dependency.status !== 'Completed') {
    throw new ApiError(409, 'Task cannot move to In Progress until its dependency is completed.');
  }

  return {
    title,
    description,
    project: project?._id || existingTask?.project,
    assignee: assignee?._id || existingTask?.assignee,
    priority,
    status,
    dueDate,
    estimatedHours,
    dependency: dependency?._id || existingTask?.dependency || undefined
  };
}

export const listTasks = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = (page - 1) * limit;
  const filter = buildTaskFilter(req);

  const [items, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter)
  ]);

  await Task.populate(items, [
    { path: 'project', select: 'title projectStatus deadline' },
    { path: 'assignee', select: 'name email role isActive' },
    { path: 'dependency', select: 'title status project' }
  ]);

  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getTask = asyncHandler(async (req, res) => {
  const item = await Task.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Task not found');
  const task = await populateTask(item);
  res.json(task);
});

export const createTask = asyncHandler(async (req, res) => {
  const project = await loadProject(req.body.projectId || req.body.project);
  const assignee = await loadActiveAssignee(req.body.assigneeId || req.body.assignee);
  const dependency = await loadDependency(req.body.dependencyId || req.body.dependency, project._id);
  const payload = buildTaskPayload(req.body, { project, assignee, dependency });

  const task = await Task.create({ ...payload, createdBy: req.user?._id });
  const attachments = await writeAttachments(task._id, req.files || []);
  if (attachments.length) {
    task.attachments.push(...attachments);
    await task.save();
  }

  await logTaskActivity({
    taskId: task._id,
    actorId: req.user?._id,
    action: 'created',
    message: `${req.user?.name || 'Task Manager'} created task "${task.title}" on ${new Date().toISOString()}`,
    metadata: { title: task.title }
  });

  const populated = await populateTask(await Task.findById(task._id));

  // Send WhatsApp notification
  if (assignee && assignee.phone) {
    const taskMessage = `Hello *${assignee.name}*,\n\nYou have been assigned a new task: *${task.title}*.\n\n*Project:* ${project.title}\n*Priority:* ${task.priority}\n*Due Date:* ${new Date(task.dueDate).toLocaleDateString()}\n*Description:* ${task.description || 'No description provided.'}\n\nPlease check your task dashboard.`;
    void sendWhatsAppMessage(assignee.phone, taskMessage);
  }

  res.status(201).json(populated);
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  const projectId = req.body.projectId || req.body.project || task.project;
  const project = await loadProject(projectId);
  const assigneeId = req.body.assigneeId || req.body.assignee || task.assignee;
  const assignee = await loadActiveAssignee(assigneeId);
  const dependencyId = req.body.dependencyId || req.body.dependency || task.dependency;
  const dependency = await loadDependency(dependencyId, project._id, task._id);
  const payload = buildTaskPayload(req.body, { existingTask: task, project, assignee, dependency });

  const previous = task.toObject();
  Object.assign(task, payload);

  if (req.files?.length) {
    const attachments = await writeAttachments(task._id, req.files);
    task.attachments.push(...attachments);
  }

  await task.save();

  const changeMessages = [];
  if (String(previous.priority) !== String(task.priority)) {
    changeMessages.push(`${req.user?.name || 'Task Manager'} updated priority to ${task.priority} on ${new Date().toISOString()}`);
    await logTaskActivity({ taskId: task._id, actorId: req.user?._id, action: 'priority', message: changeMessages.at(-1), metadata: { from: previous.priority, to: task.priority } });
  }
  if (String(previous.assignee) !== String(task.assignee)) {
    const assigneeName = assignee?.name || 'Unassigned';
    const message = `${req.user?.name || 'Task Manager'} reassigned task to ${assigneeName} on ${new Date().toISOString()}`;
    changeMessages.push(message);
    await logTaskActivity({ taskId: task._id, actorId: req.user?._id, action: 'assignee', message, metadata: { from: previous.assignee, to: task.assignee } });

    // Send WhatsApp notification for reassignment
    if (assignee && assignee.phone) {
      const taskMessage = `Hello *${assignee.name}*,\n\nYou have been assigned a task (reassigned): *${task.title}*.\n\n*Project:* ${project.title}\n*Priority:* ${task.priority}\n*Due Date:* ${new Date(task.dueDate).toLocaleDateString()}\n\nPlease check your task dashboard.`;
      void sendWhatsAppMessage(assignee.phone, taskMessage);
    }
  }
  if (String(previous.status) !== String(task.status)) {
    const message = `${req.user?.name || 'Task Manager'} changed status to ${task.status} on ${new Date().toISOString()}`;
    changeMessages.push(message);
    await logTaskActivity({ taskId: task._id, actorId: req.user?._id, action: 'status', message, metadata: { from: previous.status, to: task.status } });
  }
  if (String(previous.dueDate) !== String(task.dueDate)) {
    await logTaskActivity({ taskId: task._id, actorId: req.user?._id, action: 'dueDate', message: `${req.user?.name || 'Task Manager'} updated due date on ${new Date().toISOString()}`, metadata: { from: previous.dueDate, to: task.dueDate } });
  }
  if (String(previous.dependency) !== String(task.dependency)) {
    await logTaskActivity({ taskId: task._id, actorId: req.user?._id, action: 'dependency', message: `${req.user?.name || 'Task Manager'} linked a dependency on ${new Date().toISOString()}`, metadata: { from: previous.dependency, to: task.dependency } });
  }

  const populated = await populateTask(await Task.findById(task._id));
  res.json(populated);
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  const nextStatusValue = req.body.status || req.body.taskStatus;
  if (!nextStatusValue) throw new ApiError(400, 'Task status is required.');
  const nextStatus = normalizeStatus(nextStatusValue);
  const dependency = task.dependency ? await Task.findById(task.dependency).select('status') : null;
  if (nextStatus === 'In Progress' && dependency && dependency.status !== 'Completed') {
    throw new ApiError(409, 'Task cannot move to In Progress until its dependency is completed.');
  }

  const previousStatus = task.status;
  task.status = nextStatus;
  await task.save();

  await logTaskActivity({
    taskId: task._id,
    actorId: req.user?._id,
    action: 'status',
    message: `${req.user?.name || 'Task Manager'} changed status to ${task.status} on ${new Date().toISOString()}`,
    metadata: { from: previousStatus, to: task.status }
  });

  const populated = await populateTask(await Task.findById(task._id));
  res.json(populated);
});

export const listTaskActivities = asyncHandler(async (req, res) => {
  const activities = await TaskActivity.find({ task: req.params.id }).sort({ createdAt: -1 }).populate('actor', 'name email role');
  res.json({ items: activities });
});
