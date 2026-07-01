import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

// Create a support ticket
export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title) throw new ApiError(400, 'Title is required.');
  if (!description) throw new ApiError(400, 'Description is required.');

  const ticketId = `TIC-${Math.floor(100000 + Math.random() * 900000)}`;

  const ticket = await SupportTicket.create({
    ticketId,
    title,
    description,
    category: category || 'General',
    priority: priority || 'Medium',
    raisedBy: req.user._id,
    messages: [
      {
        sender: req.user._id,
        message: `Ticket created: ${description}`
      }
    ]
  });

  // Notify support team (admins and super admins)
  const supportStaff = await User.find({
    role: { $in: ['super_admin', 'admin', 'support_agent', 'support'] },
    isActive: true
  }).select('phone name');

  for (const staff of supportStaff) {
    if (staff.phone) {
      const message = `🔔 *New Support Ticket [${ticketId}]*\n\n*Title:* ${title}\n*Category:* ${category || 'General'}\n*Priority:* ${priority || 'Medium'}\n*Raised By:* ${req.user.name}\n\nPlease check the support panel to assign and resolve.`;
      void sendWhatsAppMessage(staff.phone, message);
    }
  }

  const populated = await SupportTicket.findById(ticket._id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone')
    .populate('messages.sender', 'name email role');

  res.status(201).json(populated);
});

// List support tickets
export const listTickets = asyncHandler(async (req, res) => {
  const filter = {};

  // Customers can only see their own tickets
  if (req.user.role === 'customer') {
    filter.raisedBy = req.user._id;
  } else {
    // Admins / Support can filter by customer or assignment
    if (req.query.raisedBy) filter.raisedBy = req.query.raisedBy;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo === 'null' ? null : req.query.assignedTo;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.category) filter.category = req.query.category;

  if (req.query.search) {
    const regex = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [
      { ticketId: regex },
      { title: regex },
      { description: regex }
    ];
  }

  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('raisedBy', 'name email role phone')
      .populate('assignedTo', 'name email role phone')
      .populate('messages.sender', 'name email role'),
    SupportTicket.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// Get ticket details
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone')
    .populate('messages.sender', 'name email role');

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  // Access check
  if (req.user.role === 'customer' && String(ticket.raisedBy._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Permission denied to view this ticket.');
  }

  res.json(ticket);
});

// Update ticket status
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone');

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  // Access check (only staff/admins can update status, except customer closing their own ticket)
  const isOwner = String(ticket.raisedBy._id) === String(req.user._id);
  const isStaff = ['super_admin', 'admin', 'support_agent', 'support'].includes(req.user.role);

  if (!isStaff && (!isOwner || req.body.status !== 'Closed')) {
    throw new ApiError(403, 'Permission denied.');
  }

  const { status } = req.body;
  if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
    throw new ApiError(400, 'Invalid status.');
  }

  ticket.status = status;
  ticket.messages.push({
    sender: req.user._id,
    message: `Status updated to: ${status}`
  });

  await ticket.save();

  // Notify customer if resolved/closed
  if (['Resolved', 'Closed'].includes(status) && ticket.raisedBy.phone) {
    const notifyMsg = `✅ *Support Ticket [${ticket.ticketId}] Update*\n\nYour support ticket "*${ticket.title}*" status has been updated to *${status}*.\n\nThank you,\nSupport Team`;
    void sendWhatsAppMessage(ticket.raisedBy.phone, notifyMsg);
  }

  const populated = await SupportTicket.findById(ticket._id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone')
    .populate('messages.sender', 'name email role');

  res.json(populated);
});

// Assign ticket
export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  const isStaff = ['super_admin', 'admin', 'support_agent', 'support'].includes(req.user.role);
  if (!isStaff) throw new ApiError(403, 'Permission denied.');

  const { assignedTo } = req.body;
  let assignee = null;

  if (assignedTo) {
    assignee = await User.findOne({ _id: assignedTo, isActive: true });
    if (!assignee) throw new ApiError(404, 'Assignee user not found or inactive.');
    ticket.assignedTo = assignee._id;
  } else {
    ticket.assignedTo = null;
  }

  const assigneeName = assignee ? assignee.name : 'Unassigned';
  ticket.messages.push({
    sender: req.user._id,
    message: `Ticket assigned to: ${assigneeName}`
  });

  await ticket.save();

  // Notify assignee
  if (assignee && assignee.phone) {
    const message = `📋 *Ticket Assigned [${ticket.ticketId}]*\n\nYou have been assigned a support ticket:\n\n*Title:* ${ticket.title}\n*Priority:* ${ticket.priority}\n\nPlease review and action this ticket.`;
    void sendWhatsAppMessage(assignee.phone, message);
  }

  const populated = await SupportTicket.findById(ticket._id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone')
    .populate('messages.sender', 'name email role');

  res.json(populated);
});

// Add message/comment to ticket
export const addTicketMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, 'Message body is required.');

  const ticket = await SupportTicket.findById(req.params.id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone');

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  // Access check
  if (req.user.role === 'customer' && String(ticket.raisedBy._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Permission denied.');
  }

  ticket.messages.push({
    sender: req.user._id,
    message
  });

  // Automatically mark as Open or In Progress if resolved and customer comments
  if (ticket.status === 'Resolved' && req.user.role === 'customer') {
    ticket.status = 'In Progress';
  }

  await ticket.save();

  // Notify the other party
  const isSenderCustomer = String(ticket.raisedBy._id) === String(req.user._id);
  if (isSenderCustomer) {
    // Notify assignee or all support agents if not assigned
    if (ticket.assignedTo && ticket.assignedTo.phone) {
      const msg = `💬 *New Customer Comment [${ticket.ticketId}]*\n\nCustomer *${req.user.name}* commented on "*${ticket.title}*":\n"${message}"`;
      void sendWhatsAppMessage(ticket.assignedTo.phone, msg);
    } else {
      // Notify all support agents
      const supportStaff = await User.find({
        role: { $in: ['super_admin', 'admin', 'support_agent', 'support'] },
        isActive: true
      }).select('phone');
      for (const staff of supportStaff) {
        if (staff.phone) {
          const msg = `💬 *New Comment on Unassigned Ticket [${ticket.ticketId}]*\n\nCustomer *${req.user.name}*: "${message}"`;
          void sendWhatsAppMessage(staff.phone, msg);
        }
      }
    }
  } else {
    // Notify customer
    if (ticket.raisedBy && ticket.raisedBy.phone) {
      const msg = `💬 *Support Agent Reply [${ticket.ticketId}]*\n\nAgent *${req.user.name}* replied to your ticket "*${ticket.title}*":\n"${message}"`;
      void sendWhatsAppMessage(ticket.raisedBy.phone, msg);
    }
  }

  const populated = await SupportTicket.findById(ticket._id)
    .populate('raisedBy', 'name email role phone')
    .populate('assignedTo', 'name email role phone')
    .populate('messages.sender', 'name email role');

  res.status(201).json(populated);
});
