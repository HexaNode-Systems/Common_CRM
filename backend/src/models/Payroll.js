import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    monthYear: { type: String, required: true }, // Format YYYY-MM
    baseSalary: { type: Number, required: true },
    leaveDeductions: { type: Number, default: 0 },
    rebate: { type: Number, default: 0 },
    rebateComment: { type: String, trim: true },
    manualDeduction: { type: Number, default: 0 },
    manualDeductionComment: { type: String, trim: true },
    netPayable: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Paid'], default: 'Draft' }
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, monthYear: 1 }, { unique: true });

export const Payroll = makeTenantModel('Payroll', payrollSchema);
