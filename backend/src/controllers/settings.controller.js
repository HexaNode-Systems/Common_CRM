import { Setting } from '../models/Setting.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { defaultSettings } from '../utils/defaultSettings.js';

// Sections anyone (including the public website) may read. Integrations are never public.
const PUBLIC_SECTIONS = ['brand', 'theme', 'content', 'contact', 'social', 'seo'];
const PROVIDERS = ['justdial', 'indiamart', 'zoho', 'website'];
// Values that are secrets: never sent back to the browser, kept when the form sends them empty.
const SECRET_FIELDS = { justdial: ['apiToken'], indiamart: ['apiKey'], zoho: ['clientSecret'], website: ['webhookSecret'] };

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const BUTTON_STYLES = ['solid', 'outline', 'soft'];
const CARD_STYLES = ['bordered', 'elevated'];
const SPLASH_BG = ['gradient', 'primary', 'secondary'];

async function getOrCreateSettings() {
  return Setting.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { ...defaultSettings, key: 'global' } },
    { new: true, upsert: true }
  );
}

const plain = (doc) => (typeof doc?.toObject === 'function' ? doc.toObject() : { ...(doc || {}) });

function publicView(doc) {
  const data = plain(doc);
  const out = { key: data.key, updatedAt: data.updatedAt };
  for (const section of PUBLIC_SECTIONS) out[section] = { ...(defaultSettings[section] || {}), ...(data[section] || {}) };
  return out;
}

// Integrations with secrets replaced by "<field>Set: true/false".
function maskedIntegrations(doc) {
  const stored = plain(doc).integrations || {};
  const out = {};
  for (const provider of PROVIDERS) {
    const value = { ...(defaultSettings.integrations[provider] || {}), ...(stored[provider] || {}) };
    for (const field of SECRET_FIELDS[provider] || []) {
      value[`${field}Set`] = Boolean(value[field]);
      value[field] = '';
    }
    out[provider] = value;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function text(value, label, max) {
  const out = String(value ?? '').trim();
  if (out.length > max) throw new ApiError(400, `${label} can be at most ${max} characters.`);
  return out;
}

// Logos and favicons: https/http links or files uploaded to this server.
function imageUrl(value, label) {
  const out = text(value, label, 1000);
  if (!out) return '';
  if (/^https?:\/\//i.test(out) || out.startsWith('/storage/') || out.startsWith('/landing/')) return out;
  throw new ApiError(400, `${label} must be an https:// link or an uploaded image.`);
}

function linkUrl(value, label) {
  const out = text(value, label, 500);
  if (!out) return '';
  if (/^https?:\/\//i.test(out)) return out;
  // "facebook.com/appnix" → "https://facebook.com/appnix"; anything with another scheme is refused.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(out) && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(out)) return `https://${out}`;
  throw new ApiError(400, `${label} must be a web link like https://example.com`);
}

function validateTheme(input = {}) {
  const out = {};
  for (const key of ['primaryColor', 'secondaryColor', 'accentColor']) {
    if (input[key] === undefined) continue;
    if (!HEX.test(String(input[key]))) throw new ApiError(400, `${key} must be a colour like #2563eb.`);
    out[key] = String(input[key]).toLowerCase();
  }
  if (input.borderRadius !== undefined) {
    const match = /^(\d{1,2})(px)?$/.exec(String(input.borderRadius).trim());
    if (!match || Number(match[1]) > 24) throw new ApiError(400, 'Corner radius must be 0 to 24 px.');
    out.borderRadius = `${Number(match[1])}px`;
  }
  if (input.fontFamily !== undefined) {
    const font = text(input.fontFamily, 'Font', 200);
    // Font names only: letters, digits, spaces, commas, quotes and hyphens.
    if (!font || !/^[\w\s,'"-]+$/.test(font)) throw new ApiError(400, 'Font can only contain font names separated by commas.');
    out.fontFamily = font;
  }
  if (input.buttonStyle !== undefined) {
    if (!BUTTON_STYLES.includes(input.buttonStyle)) throw new ApiError(400, 'Unknown button style.');
    out.buttonStyle = input.buttonStyle;
  }
  if (input.cardStyle !== undefined) {
    if (!CARD_STYLES.includes(input.cardStyle)) throw new ApiError(400, 'Unknown card style.');
    out.cardStyle = input.cardStyle;
  }
  if (input.splashEnabled !== undefined) out.splashEnabled = input.splashEnabled === true || input.splashEnabled === 'true';
  if (input.splashText !== undefined) out.splashText = text(input.splashText, 'Splash text', 120);
  if (input.splashDuration !== undefined && input.splashDuration !== '') {
    const ms = Number(input.splashDuration);
    if (!Number.isFinite(ms) || ms < 0 || ms > 10000) throw new ApiError(400, 'Splash duration must be 0 to 10000 ms.');
    out.splashDuration = Math.round(ms);
  }
  if (input.splashBgStyle !== undefined) {
    if (!SPLASH_BG.includes(input.splashBgStyle)) throw new ApiError(400, 'Unknown splash background.');
    out.splashBgStyle = input.splashBgStyle;
  }
  if (input.splashLogo !== undefined) out.splashLogo = imageUrl(input.splashLogo, 'Splash logo');
  return out;
}

function validateBrand(input = {}) {
  const out = {};
  if (input.name !== undefined) out.name = text(input.name, 'Brand name', 100);
  if (input.logo !== undefined) out.logo = imageUrl(input.logo, 'Logo');
  if (input.favicon !== undefined) out.favicon = imageUrl(input.favicon, 'Favicon');
  return out;
}

function validateTextSection(input = {}, max = 500) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === null || typeof value === 'object') continue;
    out[key] = text(value, key, max);
  }
  return out;
}

function validateSocial(input = {}) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) out[key] = linkUrl(value, key);
  return out;
}

// Each provider is merged field by field; empty secret fields keep the saved secret.
function mergeIntegrations(existing = {}, input = {}) {
  const out = { ...existing };
  for (const [provider, values] of Object.entries(input || {})) {
    if (!PROVIDERS.includes(provider) || !values || typeof values !== 'object') continue;
    const next = { ...(existing[provider] || {}) };
    for (const [field, value] of Object.entries(values)) {
      if (field.endsWith('Set')) continue;
      if ((SECRET_FIELDS[provider] || []).includes(field) && String(value ?? '') === '') continue;
      if (field === 'isActive' || field === 'paused') next[field] = value === true || value === 'true';
      else if (field === 'pollIntervalMs') {
        const ms = Number(value);
        if (!Number.isFinite(ms) || ms < 60000 || ms > 86400000) throw new ApiError(400, 'Justdial poll interval must be between 1 minute and 24 hours.');
        next[field] = Math.round(ms);
      } else if (field === 'pollUrl') next[field] = linkUrl(value, 'Justdial poll URL');
      else next[field] = text(value, field, 2000);
    }
    out[provider] = next;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

// Public: branding, theme and contact details for the website and login page.
export const getSettings = asyncHandler(async (req, res) => {
  res.json(publicView(await getOrCreateSettings()));
});

// Signed in with Settings access: integrations, secrets masked.
export const getIntegrationSettings = asyncHandler(async (req, res) => {
  res.json({ integrations: maskedIntegrations(await getOrCreateSettings()) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const existing = plain(await getOrCreateSettings());
  const body = req.body || {};
  const update = {};

  // "Reset to defaults" for the theme page.
  if (body.reset === 'theme') {
    update.theme = { ...defaultSettings.theme };
    update.brand = { ...(existing.brand || {}), ...defaultSettings.brand, name: existing.brand?.name || defaultSettings.brand.name };
  } else {
    if (body.theme) update.theme = { ...(existing.theme || {}), ...validateTheme(body.theme) };
    if (body.brand) update.brand = { ...(existing.brand || {}), ...validateBrand(body.brand) };
    if (body.content) update.content = { ...(existing.content || {}), ...validateTextSection(body.content, 2000) };
    if (body.contact) update.contact = { ...(existing.contact || {}), ...validateTextSection(body.contact, 300) };
    if (body.social) update.social = { ...(existing.social || {}), ...validateSocial(body.social) };
    if (body.seo) update.seo = { ...(existing.seo || {}), ...validateTextSection(body.seo, 500) };
    if (body.integrations) update.integrations = mergeIntegrations(existing.integrations || {}, body.integrations);
  }

  const settings = await Setting.findOneAndUpdate({ key: 'global' }, { $set: update }, { new: true, runValidators: true });
  res.json({ ...publicView(settings), integrations: maskedIntegrations(settings) });
});

/** Integration settings for server code (webhooks, Justdial poller). Includes secrets. */
export async function readIntegrationSettings() {
  const doc = await Setting.findOne({ key: 'global' });
  const stored = plain(doc).integrations || {};
  const out = {};
  for (const provider of PROVIDERS) out[provider] = { ...(defaultSettings.integrations[provider] || {}), ...(stored[provider] || {}) };
  return out;
}
