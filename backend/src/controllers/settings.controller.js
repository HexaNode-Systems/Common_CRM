import { Setting } from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { defaultSettings } from '../utils/defaultSettings.js';

async function getOrCreateSettings() {
  return Setting.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { ...defaultSettings, key: 'global' } },
    { new: true, upsert: true }
  );
}

export const getSettings = asyncHandler(async (req, res) => {
  res.json(await getOrCreateSettings());
});

export const updateSettings = asyncHandler(async (req, res) => {
  const existing = await getOrCreateSettings();
  const payload = {
    brand: { ...existing.brand, ...req.body.brand },
    theme: { ...existing.theme, ...req.body.theme },
    content: { ...existing.content, ...req.body.content },
    contact: { ...existing.contact, ...req.body.contact },
    social: { ...existing.social, ...req.body.social },
    seo: { ...existing.seo, ...req.body.seo }
  };

  const settings = await Setting.findOneAndUpdate({ key: 'global' }, payload, { new: true, runValidators: true });
  res.json(settings);
});

