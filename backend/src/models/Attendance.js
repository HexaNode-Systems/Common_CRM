import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Present', 'Absent (Unpaid)', 'Approved Paid Leave', 'Holiday', 'Weekly Off'],
      required: true
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Attendance = makeTenantModel('Attendance', attendanceSchema);
