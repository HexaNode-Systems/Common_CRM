import mongoose from 'mongoose';
import { defaultSettings } from '../utils/defaultSettings.js';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    brand: { type: Object, default: defaultSettings.brand },
    theme: { type: Object, default: defaultSettings.theme },
    content: { type: Object, default: defaultSettings.content },
    contact: { type: Object, default: defaultSettings.contact },
    social: { type: Object, default: defaultSettings.social },
    seo: { type: Object, default: defaultSettings.seo }
  },
  { timestamps: true, minimize: false }
);

export const Setting = mongoose.model('Setting', settingSchema);

