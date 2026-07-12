import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    image: { url: String, publicId: String },
    ctaText: String,
    ctaUrl: String,
    placement: { type: String, default: 'home' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Banner = makeTenantModel('Banner', bannerSchema);

