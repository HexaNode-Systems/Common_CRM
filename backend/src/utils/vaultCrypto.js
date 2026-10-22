import crypto from 'crypto';

/*
 * Vault encryption.
 *
 * New secrets are encrypted with VAULT_MASTER_KEY (required, at least 32 characters) and stamped
 * keyVersion "v2". Secrets saved by the old code were encrypted with JWT_SECRET (or, if that was
 * missing, an empty key). Those can still be opened with the legacy keys below and are
 * re-encrypted with the master key the first time they are revealed, or all at once with
 * `npm run vault:migrate`.
 *
 * Keep the old JWT_SECRET in VAULT_LEGACY_SECRETS (comma separated) until the migration has run
 * if you rotate JWT_SECRET.
 */

export const CURRENT_KEY_VERSION = 'v2';
const MIN_KEY_LENGTH = 32;

const sha = (value) => crypto.createHash('sha256').update(String(value)).digest();

export function vaultKeyProblem() {
  const key = process.env.VAULT_MASTER_KEY || '';
  if (!key) return 'The vault is not configured. Set VAULT_MASTER_KEY (at least 32 random characters) in the server .env and restart.';
  if (key.length < MIN_KEY_LENGTH) return `VAULT_MASTER_KEY is too short (${key.length} characters). Use at least ${MIN_KEY_LENGTH}.`;
  if (process.env.JWT_SECRET && key === process.env.JWT_SECRET) return 'VAULT_MASTER_KEY must be different from JWT_SECRET.';
  return null;
}

function currentKey() {
  const problem = vaultKeyProblem();
  if (problem) {
    const err = new Error(problem);
    err.statusCode = 503;
    throw err;
  }
  return sha(process.env.VAULT_MASTER_KEY);
}

// Keys the old code may have used, most likely first.
function legacyKeys() {
  const secrets = [
    process.env.JWT_SECRET,
    ...String(process.env.VAULT_LEGACY_SECRETS || '').split(',').map((s) => s.trim())
  ].filter(Boolean);
  return [...secrets.map(sha), sha('')];
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', currentKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value ?? ''), 'utf8'), cipher.final()]);
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    keyVersion: CURRENT_KEY_VERSION
  };
}

function tryDecrypt(key, payload) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv || '', 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag || '', 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext || '', 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Returns { secret, needsRewrap }. needsRewrap = true when the secret was opened with a legacy
 * key and should be saved again with encryptSecret().
 */
export function decryptSecret(payload = {}) {
  const master = currentKey(); // refuses to work until the master key is set
  // The old code also used VAULT_MASTER_KEY when it was set, so try it first for every secret.
  const withMaster = tryDecrypt(master, payload);
  if (withMaster !== null) return { secret: withMaster, needsRewrap: payload.keyVersion !== CURRENT_KEY_VERSION };
  // Old code's keys, or a previous VAULT_MASTER_KEY listed in VAULT_LEGACY_SECRETS.
  for (const key of legacyKeys()) {
    const secret = tryDecrypt(key, payload);
    if (secret !== null) return { secret, needsRewrap: true };
  }
  const err = new Error('This secret can’t be decrypted with the keys on this server. If JWT_SECRET or VAULT_MASTER_KEY was changed, add the old value to VAULT_LEGACY_SECRETS, or re-enter the password.');
  err.statusCode = 409;
  throw err;
}
