import mongoose from 'mongoose';

const leadDistributionRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    triggerSource: {
      type: String,
      enum: ['all', 'website_form', 'justdial', 'indiamart', 'zoho', 'csv_import', 'manual_entry'],
      default: 'all'
    },
    distributionType: {
      type: String,
      enum: ['round_robin', 'single_assignee'],
      default: 'round_robin'
    },
    salespersons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    singleAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    currentIndex: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const LeadDistributionRule = mongoose.model('LeadDistributionRule', leadDistributionRuleSchema);
