import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ title: String, quantity: Number, price: Number }],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
    dueDate: Date
  },
  { timestamps: true }
);

export const Invoice = makeTenantModel('Invoice', invoiceSchema);

