import crypto from 'crypto';

function getMasterKey() {
  const secret = process.env.VAULT_MASTER_KEY || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value || ''), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

export function decryptSecret(payload = {}) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getMasterKey(),
    Buffer.from(payload.iv || '', 'base64')
  );
  decipher.setAuthTag(Buffer.from(payload.tag || '', 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext || '', 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}
