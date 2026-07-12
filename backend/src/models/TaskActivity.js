import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const taskActivitySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const TaskActivity = makeTenantModel('TaskActivity', taskActivitySchema);
