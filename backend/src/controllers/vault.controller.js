import mongoose from 'mongoose';
import { VaultCredential } from '../models/VaultCredential.js';
import { AuditLog } from '../models/AuditLog.js';
import { Role } from '../models/Role.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasAccess } from '../middleware/auth.middleware.js';
import { decryptSecret, encryptSecret, vaultKeyProblem } from '../utils/vaultCrypto.js';

const SECRET_FIELDS = '+secretCiphertext +secretIv +secretTag +keyVersion';
// Links the page may open. Anything else (javascript:, data:, …) is rejected.
const ALLOWED_SCHEMES = ['http:', 'https:', 'ftp:', 'sftp:', 'ssh:'];

/* ------------------------------------------------------------------ */
/* Access                                                              */
/* ------------------------------------------------------------------ */

// Full access on Vault (or super admin) = vault manager: sees every credential, decides who can
// see what, deletes, and reads the reveal history.
async function isVaultManager(user) {
  return hasAccess(user, 'vault:delete');
}

function canSee(user, credential, manager) {
  if (manager) return true;
  const groups = credential.accessGroups || [];
  return groups.length === 0 || groups.includes(user.role);
}

async function loadVisible(id, user, manager, withSecret = false) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ''))) throw new ApiError(404, 'Credential not found');
  const query = VaultCredential.findById(id);
  const credential = await (withSecret ? query.select(SECRET_FIELDS) : query);
  // Hidden credentials answer "not found" so their existence isn't revealed.
  if (!credential || !canSee(user, credential, manager)) throw new ApiError(404, 'Credential not found');
  return credential;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function text(value, label, max, required = true) {
  const out = String(value ?? '').trim();
  if (required && !out) throw new ApiError(400, `${label} is required.`);
  if (out.length > max) throw new ApiError(400, `${label} can be at most ${max} characters.`);
  return out;
}

function platformUrl(value) {
  const raw = text(value, 'Platform URL', 500);
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (scheme && !/^[a-z0-9.-]+:\d+/i.test(raw) && !ALLOWED_SCHEMES.includes(`${scheme[1].toLowerCase()}:`)) {
    throw new ApiError(400, `Links starting with "${scheme[1]}:" aren't allowed. Use http(s), ftp, sftp, ssh or a plain host name.`);
  }
  return raw;
}

// Passwords are stored exactly as typed, spaces included.
function secretValue(value) {
  const raw = String(value ?? '');
  if (!raw.trim()) throw new ApiError(400, 'Password / Token Key is required.');
  if (raw.length > 5000) throw new ApiError(400, 'Password / Token Key can be at most 5000 characters.');
  return raw;
}

function parseBool(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new ApiError(400, 'Status must be true or false.');
}

async function parseAccessGroups(value) {
  let list = value;
  if (typeof value === 'string') {
    try { list = JSON.parse(value); } catch { list = value.split(','); }
  }
  if (!Array.isArray(list)) list = [];
  const groups = [...new Set(list.map((g) => String(g).trim()).filter(Boolean))];
  if (!groups.length) return [];
  const roles = await Role.find({ slug: { $in: groups }, isDeleted: { $ne: true } }).select('slug');
  const known = new Set(roles.map((r) => r.slug));
  const unknown = groups.filter((g) => !known.has(g) && g !== 'super_admin');
  if (unknown.length) throw new ApiError(400, `Unknown role(s): ${unknown.join(', ')}.`);
  return groups;
}

function vaultReady() {
  const problem = vaultKeyProblem();
  if (problem) throw new ApiError(503, problem);
}

function present(credential, { manager, user }) {
  const plain = typeof credential.toObject === 'function' ? credential.toObject() : { ...credential };
  delete plain.secretCiphertext;
  delete plain.secretIv;
  delete plain.secretTag;
  delete plain.keyVersion;
  return { ...plain, secret: '••••••••', canManage: manager, canSeeAll: manager || !(plain.accessGroups || []).length || (plain.accessGroups || []).includes(user.role) };
}

async function audit(user, credential, action, extra = {}) {
  await AuditLog.create({
    scope: 'vault',
    actor: user?._id,
    action,
    message: `${user?.name || 'User'} ${action} "${credential.title}"`,
    metadata: { credentialId: credential._id, title: credential.title, ...extra }
  });
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const listVaultCredentials = asyncHandler(async (req, res) => {
  const manager = await isVaultManager(req.user);
  const items = await VaultCredential.find().sort({ createdAt: -1 }).populate('createdBy', 'name email role');
  res.json({
    items: items.filter((c) => canSee(req.user, c, manager)).map((c) => present(c, { manager, user: req.user })),
    canManage: manager,
    keyProblem: vaultKeyProblem()
  });
});

export const getVaultCredential = asyncHandler(async (req, res) => {
  const manager = await isVaultManager(req.user);
  const credential = await loadVisible(req.params.id, req.user, manager);
  res.json(present(credential, { manager, user: req.user }));
});

export const createVaultCredential = asyncHandler(async (req, res) => {
  vaultReady();
  const manager = await isVaultManager(req.user);
  const body = req.body || {};
  const accessGroups = await parseAccessGroups(body.accessGroups);
  // Non-managers can't hide a credential from themselves (or from everyone but another role).
  if (!manager && accessGroups.length && !accessGroups.includes(req.user.role)) {
    throw new ApiError(400, 'Include your own role in "Who can see this", or leave it empty for everyone.');
  }

  const encrypted = encryptSecret(secretValue(body.secret));
  const credential = await VaultCredential.create({
    title: text(body.title, 'Account title', 200),
    platformUrl: platformUrl(body.platformUrl),
    username: text(body.username, 'Username / Email ID', 200),
    secretCiphertext: encrypted.ciphertext,
    secretIv: encrypted.iv,
    secretTag: encrypted.tag,
    keyVersion: encrypted.keyVersion,
    accessGroups,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    secretChangedAt: new Date()
  });
  await audit(req.user, credential, 'created');
  res.status(201).json(present(credential, { manager, user: req.user }));
});

export const updateVaultCredential = asyncHandler(async (req, res) => {
  const manager = await isVaultManager(req.user);
  const credential = await loadVisible(req.params.id, req.user, manager);
  const body = req.body || {};
  const changed = [];

  if (body.title !== undefined) { credential.title = text(body.title, 'Account title', 200); changed.push('title'); }
  if (body.platformUrl !== undefined) { credential.platformUrl = platformUrl(body.platformUrl); changed.push('URL'); }
  if (body.username !== undefined) { credential.username = text(body.username, 'Username / Email ID', 200); changed.push('username'); }

  if (body.accessGroups !== undefined) {
    const next = await parseAccessGroups(body.accessGroups);
    const same = JSON.stringify([...next].sort()) === JSON.stringify([...(credential.accessGroups || [])].sort());
    if (!same) {
      if (!manager) throw new ApiError(403, 'Only vault managers (Full access) can change who sees a credential.');
      credential.accessGroups = next;
      changed.push('access');
    }
  }

  if (body.secret !== undefined && String(body.secret) !== '') {
    vaultReady();
    const encrypted = encryptSecret(secretValue(body.secret));
    credential.secretCiphertext = encrypted.ciphertext;
    credential.secretIv = encrypted.iv;
    credential.secretTag = encrypted.tag;
    credential.keyVersion = encrypted.keyVersion;
    credential.secretChangedAt = new Date();
    changed.push('password');
  }

  credential.updatedBy = req.user._id;
  await credential.save();
  if (changed.length) await audit(req.user, credential, 'updated', { changed });
  res.json(present(credential, { manager, user: req.user }));
});

export const updateVaultStatus = asyncHandler(async (req, res) => {
  const manager = await isVaultManager(req.user);
  const credential = await loadVisible(req.params.id, req.user, manager);
  const next = parseBool(req.body?.isActive);
  if (credential.isActive !== next) {
    credential.isActive = next;
    credential.updatedBy = req.user._id;
    await credential.save();
    await audit(req.user, credential, next ? 'reactivated' : 'suspended');
  }
  res.json(present(credential, { manager, user: req.user }));
});

export const revealVaultCredential = asyncHandler(async (req, res) => {
  vaultReady();
  const manager = await isVaultManager(req.user);
  const credential = await loadVisible(req.params.id, req.user, manager, true);
  if (!credential.isActive) throw new ApiError(409, 'This credential is suspended. Reactivate it before revealing the password.');

  const { secret, needsRewrap } = decryptSecret({
    ciphertext: credential.secretCiphertext,
    iv: credential.secretIv,
    tag: credential.secretTag,
    keyVersion: credential.keyVersion
  });

  // Secrets saved with an old key are moved to VAULT_MASTER_KEY the first time they are opened.
  if (needsRewrap) {
    const encrypted = encryptSecret(secret);
    credential.secretCiphertext = encrypted.ciphertext;
    credential.secretIv = encrypted.iv;
    credential.secretTag = encrypted.tag;
    credential.keyVersion = encrypted.keyVersion;
    await credential.save();
  }

  await audit(req.user, credential, 'revealed', { ip: req.ip });
  res.set('Cache-Control', 'no-store');
  res.json({ secret });
});

export const deleteVaultCredential = asyncHandler(async (req, res) => {
  const manager = await isVaultManager(req.user);
  if (!manager) throw new ApiError(403, 'Only vault managers can delete credentials.');
  const credential = await loadVisible(req.params.id, req.user, true);
  await VaultCredential.deleteOne({ _id: credential._id });
  await audit(req.user, credential, 'deleted');
  res.json({ message: 'Credential deleted.' });
});

// Who created, changed, revealed or deleted credentials. Managers only.
export const listVaultAudit = asyncHandler(async (req, res) => {
  const filter = { scope: 'vault' };
  if (req.query.credentialId) {
    if (!mongoose.Types.ObjectId.isValid(String(req.query.credentialId))) throw new ApiError(400, 'Invalid credential.');
    filter['metadata.credentialId'] = new mongoose.Types.ObjectId(String(req.query.credentialId));
  }
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 100), 500);
  const items = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).populate('actor', 'name email role');
  res.json({ items });
});

export const listVaultRoles = asyncHandler(async (_req, res) => {
  const roles = await Role.find({ isActive: true, isDeleted: { $ne: true } }).select('name slug');
  res.json({ items: roles.map((role) => ({ _id: role._id, name: role.name, slug: role.slug })) });
});
