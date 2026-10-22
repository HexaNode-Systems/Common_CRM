import crypto from 'crypto';
import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Module } from '../models/Module.js';
import { RolePermission } from '../models/RolePermission.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasAccess } from '../middleware/auth.middleware.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const CATEGORIES = ['Technical', 'Billing', 'Sales', 'General', 'Feedback'];
// Phone numbers are only read on the server for notifications, never sent to the browser.
const PERSON = 'name email role';

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;
const sameId = (a, b) => String(a?._id || a || '') === String(b?._id || b || '');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pick(value, list, label) {
  const key = String(value ?? '').trim().toLowerCase();
  const found = list.find((item) => item.toLowerCase() === key);
  if (!found) throw new ApiError(400, `${label} must be one of: ${list.join(', ')}.`);
  return found;
}

function text(value, label, max, required = true) {
  const out = String(value ?? '').trim();
  if (required && !out) throw new ApiError(400, `${label} is required.`);
  if (out.length > max) throw new ApiError(400, `${label} can be at most ${max} characters.`);
  return out;
}

/* ------------------------------------------------------------------ */
/* Who is support staff                                                */
/* ------------------------------------------------------------------ */

// Full access on Support Desk (or super admin) = support staff: sees every ticket, assigns, sets any status.
async function isStaff(user) {
  return hasAccess(user, 'support:delete');
}

// Role slugs with at least `level` on the Support module (2 = Update, 3 = Full).
async function supportRoleSlugs(level) {
  const mod = await Module.findOne({ name: 'support', isActive: true });
  if (!mod) return [];
  const perms = await RolePermission.find({ moduleId: mod._id, permission: { $gte: level } });
  if (!perms.length) return [];
  const roles = await Role.find({ _id: { $in: perms.map((p) => p.roleId) }, isActive: true });
  return roles.map((r) => r.slug);
}

// People who can work tickets: active employees with Support "Update" or more.
async function agentFilter() {
  const slugs = await supportRoleSlugs(2);
  return { isActive: true, role: { $in: [...new Set(['super_admin', ...slugs])], $ne: 'customer' } };
}

async function staffToNotify() {
  const slugs = await supportRoleSlugs(3);
  return User.find({ isActive: true, role: { $in: [...new Set(['super_admin', ...slugs])] } }).select('name phone');
}

function canSee(user, ticket, staff) {
  return staff || sameId(ticket.raisedBy, user._id) || sameId(ticket.assignedTo, user._id);
}

async function loadTicket(id, user, staff) {
  if (!isId(id)) throw new ApiError(404, 'Ticket not found.');
  const ticket = await SupportTicket.findById(id);
  // Tickets you can't see answer "not found".
  if (!ticket || !canSee(user, ticket, staff)) throw new ApiError(404, 'Ticket not found.');
  return ticket;
}

async function present(ticket, user, staff) {
  await SupportTicket.populate(ticket, [
    { path: 'raisedBy', select: PERSON },
    { path: 'assignedTo', select: PERSON },
    { path: 'messages.sender', select: PERSON }
  ]);
  const plain = typeof ticket.toObject === 'function' ? ticket.toObject() : { ...ticket };
  const isRaiser = sameId(plain.raisedBy, user._id);
  const isAssignee = sameId(plain.assignedTo, user._id);
  return {
    ...plain,
    canManage: staff,
    canAssign: staff,
    canReply: staff || isRaiser || isAssignee,
    // Status options this person may pick.
    allowedStatuses: staff
      ? STATUSES
      : isAssignee
        ? ['Open', 'In Progress', 'Resolved']
        : isRaiser ? (['Resolved', 'Closed'].includes(plain.status) ? ['Open'] : ['Closed']) : []
  };
}

function notify(phone, message, actor) {
  if (!phone) return;
  (async () => {
    let sent = null;
    if (actor?._id) sent = await sendWhatsAppMessage(String(actor._id), phone, message);
    if (!sent) await sendWhatsAppMessage(phone, message);
  })().catch((err) => console.error('Support WhatsApp notification failed:', err?.message || err));
}

async function phoneOf(id) {
  if (!id) return null;
  const user = await User.findById(id?._id || id).select('phone');
  return user?.phone || null;
}

async function newTicketId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = attempt < 5
      ? `TIC-${100000 + crypto.randomInt(900000)}`
      : `TIC-${Date.now().toString(36).toUpperCase()}${crypto.randomInt(1296).toString(36).toUpperCase()}`;
    if (!(await SupportTicket.findOne({ ticketId: id }))) return id;
  }
  return `TIC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const createTicket = asyncHandler(async (req, res) => {
  const staff = await isStaff(req.user);
  const body = req.body || {};
  const title = text(body.title, 'Title', 200);
  const description = text(body.description, 'Description', 5000);
  const category = body.category ? pick(body.category, CATEGORIES, 'Category') : 'General';
  const priority = body.priority ? pick(body.priority, PRIORITIES, 'Priority') : 'Medium';

  let ticket = null;
  for (let attempt = 0; attempt < 3 && !ticket; attempt += 1) {
    try {
      ticket = await SupportTicket.create({
        ticketId: await newTicketId(),
        title,
        description,
        category,
        priority,
        raisedBy: req.user._id,
        messages: [{ sender: req.user._id, message: 'Ticket created' }]
      });
    } catch (err) {
      if (err?.code !== 11000 || attempt === 2) throw err; // ID taken at the same moment: try another
    }
  }

  const staffList = await staffToNotify();
  for (const person of staffList) {
    if (sameId(person._id, req.user._id)) continue;
    notify(person.phone, `🔔 *New Support Ticket [${ticket.ticketId}]*\n\n*Title:* ${title}\n*Category:* ${category}\n*Priority:* ${priority}\n*Raised By:* ${req.user.name}\n\nPlease check the support panel to assign and resolve.`, req.user);
  }

  res.status(201).json(await present(ticket, req.user, staff));
});

export const listTickets = asyncHandler(async (req, res) => {
  const staff = await isStaff(req.user);
  const and = [];

  if (!staff) and.push({ $or: [{ raisedBy: req.user._id }, { assignedTo: req.user._id }] });
  if (staff && req.query.raisedBy) {
    if (!isId(req.query.raisedBy)) throw new ApiError(400, 'Unknown person filter.');
    and.push({ raisedBy: req.query.raisedBy });
  }
  if (req.query.assignedTo) {
    if (req.query.assignedTo === 'null') and.push({ assignedTo: null });
    else if (req.query.assignedTo === 'me') and.push({ assignedTo: req.user._id });
    else if (isId(req.query.assignedTo)) and.push({ assignedTo: req.query.assignedTo });
    else throw new ApiError(400, 'Unknown assignee filter.');
  }
  if (req.query.status) and.push({ status: pick(req.query.status, STATUSES, 'Status') });
  if (req.query.priority) and.push({ priority: pick(req.query.priority, PRIORITIES, 'Priority') });
  if (req.query.category) and.push({ category: pick(req.query.category, CATEGORIES, 'Category') });

  const search = String(req.query.search || '').trim().slice(0, 100);
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: [{ ticketId: regex }, { title: regex }, { description: regex }] });
  }

  const filter = and.length ? { $and: and } : {};
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 50), 100);

  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SupportTicket.countDocuments(filter)
  ]);
  const out = [];
  for (const item of items) out.push(await present(item, req.user, staff));

  res.json({ items: out, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }, canManage: staff });
});

export const getTicket = asyncHandler(async (req, res) => {
  const staff = await isStaff(req.user);
  const ticket = await loadTicket(req.params.id, req.user, staff);
  res.json(await present(ticket, req.user, staff));
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const staff = await isStaff(req.user);
  const ticket = await loadTicket(req.params.id, req.user, staff);
  const status = pick(req.body?.status, STATUSES, 'Status');
  const allowed = (await present(ticket, req.user, staff)).allowedStatuses;
  if (!allowed.includes(status)) throw new ApiError(403, `You can’t set this ticket to ${status}.`);

  if (status !== ticket.status) {
    ticket.status = status;
    ticket.messages.push({ sender: req.user._id, message: `Status updated to: ${status}` });
    await ticket.save();

    if (['Resolved', 'Closed'].includes(status) && !sameId(ticket.raisedBy, req.user._id)) {
      notify(await phoneOf(ticket.raisedBy), `✅ *Support Ticket [${ticket.ticketId}] Update*\n\nYour support ticket "*${ticket.title}*" status has been updated to *${status}*.\n\nThank you,\nSupport Team`, req.user);
    }
  }
  res.json(await present(ticket, req.user, staff));
});

export const assignTicket = asyncHandler(async (req, res) => {
  const staff = await isStaff(req.user);
  if (!staff) throw new ApiError(403, 'Only support staff (Full access on Support Desk) can assign tickets.');
  const ticket = await loadTicket(req.params.id, req.user, staff);

  const assignedTo = req.body?.assignedTo;
  let assignee = null;
  if (assignedTo) {
    if (!isId(assignedTo)) throw new ApiError(400, 'Choose a valid support agent.');
    assignee = await User.findOne({ _id: assignedTo, ...(await agentFilter()) }).select('name phone role');
    if (!assignee) throw new ApiError(400, 'Choose an active employee with Support Desk access (customers can’t be agents).');
  }
  if (sameId(ticket.assignedTo, assignee?._id)) return res.json(await present(ticket, req.user, staff));

  ticket.assignedTo = assignee?._id || null;
  ticket.messages.push({ sender: req.user._id, message: `Ticket assigned to: ${assignee ? assignee.name : 'Unassigned'}` });
  if (assignee && ticket.status === 'Open') ticket.status = 'In Progress';
  await ticket.save();

  if (assignee && !sameId(assignee._id, req.user._id)) {
    notify(assignee.phone, `📋 *Ticket Assigned [${ticket.ticketId}]*\n\nYou have been assigned a support ticket:\n\n*Title:* ${ticket.title}\n*Priority:* ${ticket.priority}\n\nPlease review and action this ticket.`, req.user);
  }
  res.json(await present(ticket, req.user, staff));
});

export const addTicketMessage = asyncHandler(async (req, res) => {
  const staff = await isStaff(req.user);
  const ticket = await loadTicket(req.params.id, req.user, staff);
  const message = text(req.body?.message, 'Message', 5000);

  const isRaiser = sameId(ticket.raisedBy, req.user._id);
  ticket.messages.push({ sender: req.user._id, message });

  // A reply on a finished ticket reopens it.
  if (ticket.status === 'Closed' || (ticket.status === 'Resolved' && isRaiser)) {
    const reopened = ticket.assignedTo ? 'In Progress' : 'Open';
    ticket.messages.push({ sender: req.user._id, message: `Status updated to: ${reopened}` });
    ticket.status = reopened;
  }
  await ticket.save();

  if (isRaiser) {
    if (ticket.assignedTo) {
      notify(await phoneOf(ticket.assignedTo), `💬 *New Comment [${ticket.ticketId}]*\n\n*${req.user.name}* commented on "*${ticket.title}*":\n"${message.slice(0, 500)}"`, req.user);
    } else {
      for (const person of await staffToNotify()) {
        if (sameId(person._id, req.user._id)) continue;
        notify(person.phone, `💬 *New Comment on Unassigned Ticket [${ticket.ticketId}]*\n\n*${req.user.name}*: "${message.slice(0, 500)}"`, req.user);
      }
    }
  } else {
    notify(await phoneOf(ticket.raisedBy), `💬 *Support Reply [${ticket.ticketId}]*\n\n*${req.user.name}* replied to your ticket "*${ticket.title}*":\n"${message.slice(0, 500)}"`, req.user);
  }

  res.status(201).json(await present(ticket, req.user, staff));
});

// People a ticket can be assigned to (staff only; no Users access needed).
export const listSupportAgents = asyncHandler(async (req, res) => {
  if (!(await isStaff(req.user))) return res.json({ items: [] });
  const items = await User.find(await agentFilter()).select('name email role').sort({ name: 1 });
  res.json({ items });
});
