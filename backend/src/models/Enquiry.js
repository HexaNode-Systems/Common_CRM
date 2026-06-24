import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    subject: String,
    message: String,
    source: String,
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'closed'], default: 'new' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Enquiry = mongoose.model('Enquiry', enquirySchema);

