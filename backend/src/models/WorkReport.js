import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const workReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    tasksCompleted: { type: String, required: true, trim: true },
    hoursWorked: { type: Number, default: 8, required: true },
    challenges: { type: String, trim: true },
    nextDayPlan: { type: String, trim: true }
  },
  { timestamps: true }
);

// Prevent duplicate reports by the same user on the same calendar day (UTC-based index or simple query check in controller)
export const WorkReport = makeTenantModel('WorkReport', workReportSchema);
