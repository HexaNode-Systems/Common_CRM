import { VaultCredential } from '../models/VaultCredential.js';
import { AuditLog } from '../models/AuditLog.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { decryptSecret, encryptSecret } from '../utils/vaultCrypto.js';

function normalizeAccessGroups(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function canViewCredential(user, accessGroups = []) {
  if (!accessGroups.length) return true;
  const roleValue = String(user.role || '').toLowerCase();
  const normalizedUserRole = roleValue.replace(/\s+/g, '_');
  return accessGroups.some((group) => String(group).toLowerCase() === normalizedUserRole || String(group) === user.role);
}

async function listAccessibleRoles() {
  const roles = await Role.find({ isActive: true }).select('name slug');
  return roles.map((role) => ({ _id: role._id, name: role.name, slug: role.slug }));
}

function sanitizeCredential(credential) {
  const plain = credential.toObject();
  return {
    ...plain,
    secret: '••••••••'
  };
}

async function ensureVaultAccess(req, credential) {
  if (!canViewCredential(req.user, credential.accessGroups || [])) {
    throw new ApiError(403, 'You do not have access to this credential.');
  }
}

export const listVaultCredentials = asyncHandler(async (req, res) => {
  const items = await VaultCredential.find().sort({ createdAt: -1 }).populate('createdBy', 'name email role');
  res.json({ items: items.map(sanitizeCredential) });
});

export const getVaultCredential = asyncHandler(async (req, res) => {
  const credential = await VaultCredential.findById(req.params.id).populate('createdBy', 'name email role');
  if (!credential) throw new ApiError(404, 'Credential not found');
  await ensureVaultAccess(req, credential);
  res.json(sanitizeCredential(credential));
});

export const createVaultCredential = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const platformUrl = String(req.body.platformUrl || '').trim();
  const username = String(req.body.username || '').trim();
  const secret = String(req.body.secret || '').trim();
  const accessGroups = normalizeAccessGroups(req.body.accessGroups);

  if (!title) throw new ApiError(400, 'Account Title is required.');
  if (!platformUrl) throw new ApiError(400, 'Platform URL is required.');
  if (!username) throw new ApiError(400, 'Username / Email ID is required.');
  if (!secret) throw new ApiError(400, 'Password / Token Key is required.');

  const encrypted = encryptSecret(secret);
  const credential = await VaultCredential.create({
    title,
    platformUrl,
    username,
    secretCiphertext: encrypted.ciphertext,
    secretIv: encrypted.iv,
    secretTag: encrypted.tag,
    accessGroups,
    createdBy: req.user?._id
  });

  res.status(201).json(sanitizeCredential(credential));
});

export const updateVaultCredential = asyncHandler(async (req, res) => {
  const credential = await VaultCredential.findById(req.params.id);
  if (!credential) throw new ApiError(404, 'Credential not found');
  await ensureVaultAccess(req, credential);

  if (req.body.title !== undefined) credential.title = String(req.body.title || '').trim();
  if (req.body.platformUrl !== undefined) credential.platformUrl = String(req.body.platformUrl || '').trim();
  if (req.body.username !== undefined) credential.username = String(req.body.username || '').trim();
  if (req.body.accessGroups !== undefined) credential.accessGroups = normalizeAccessGroups(req.body.accessGroups);
  if (String(req.body.secret || '').trim()) {
    const encrypted = encryptSecret(req.body.secret);
    credential.secretCiphertext = encrypted.ciphertext;
    credential.secretIv = encrypted.iv;
    credential.secretTag = encrypted.tag;
  }

  await credential.save();
  res.json(sanitizeCredential(credential));
});

export const updateVaultStatus = asyncHandler(async (req, res) => {
  const credential = await VaultCredential.findById(req.params.id);
  if (!credential) throw new ApiError(404, 'Credential not found');
  await ensureVaultAccess(req, credential);
  credential.isActive = Boolean(req.body.isActive);
  await credential.save();
  res.json(sanitizeCredential(credential));
});

export const revealVaultCredential = asyncHandler(async (req, res) => {
  const credential = await VaultCredential.findById(req.params.id).select('+secretCiphertext +secretIv +secretTag');
  if (!credential) throw new ApiError(404, 'Credential not found');
  await ensureVaultAccess(req, credential);

  const secret = decryptSecret({
    ciphertext: credential.secretCiphertext,
    iv: credential.secretIv,
    tag: credential.secretTag
  });

  await AuditLog.create({
    scope: 'vault',
    actor: req.user?._id,
    action: 'reveal',
    message: `${req.user?.name || 'User'} viewed credentials for ${credential.title} on ${new Date().toISOString()}`,
    metadata: { credentialId: credential._id, title: credential.title }
  });

  res.json({ secret });
});

export const listVaultRoles = asyncHandler(async (_req, res) => {
  res.json({ items: await listAccessibleRoles() });
});
