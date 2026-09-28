import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    provider: String,
    transactionId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paidAt: Date,
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);


// Speeds up queries that filter by status and date, and read amount
paymentSchema.index({ status: 1, createdAt: 1, amount: 1 });

export const Payment = makeTenantModel('Payment', paymentSchema);

