import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    // Location on the server. New files live in private-storage/tasks; files uploaded before
    // the fix are under storage/tasks (no longer served publicly). Never sent to the browser.
    path: { type: String, required: true },
    // Authenticated download URL: /api/v1/tasks/:id/attachments/:filename
    url: { type: String, required: true },
    mimetype: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 10000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogItem', required: true, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium', index: true },
    status: {
      type: String,
      enum: ['Backlog', 'In Progress', 'In Review', 'Completed', 'On Hold'],
      default: 'Backlog',
      index: true
    },
    dueDate: { type: Date, required: true, index: true },
    estimatedHours: { type: Number, default: 0, min: 0, max: 10000 },
    dependency: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    attachments: [attachmentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Task = makeTenantModel('Task', taskSchema);
