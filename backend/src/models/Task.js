import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    path: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
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
    estimatedHours: { type: Number, default: 0, min: 0 },
    dependency: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    attachments: [attachmentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Task = makeTenantModel('Task', taskSchema);
