import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const workReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    // Calendar day of the report in the company's time zone ("2026-10-22"). One report per person per day.
    day: { type: String },
    tasksCompleted: { type: String, required: true, trim: true, maxlength: 5000 },
    hoursWorked: { type: Number, default: 8, required: true, min: 0.25, max: 24 },
    challenges: { type: String, trim: true, maxlength: 3000 },
    nextDayPlan: { type: String, trim: true, maxlength: 3000 },
    editedAt: Date,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Reports saved before "day" existed are not covered, so old data never blocks this index.
workReportSchema.index({ user: 1, day: 1 }, { unique: true, partialFilterExpression: { day: { $type: 'string' } } });
workReportSchema.index({ date: -1 });

export const WorkReport = makeTenantModel('WorkReport', workReportSchema);
