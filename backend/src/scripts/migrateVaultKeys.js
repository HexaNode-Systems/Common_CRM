/*
 * Re-encrypts every vault secret with VAULT_MASTER_KEY.
 *
 *   npm run vault:migrate            (dry run: reports what would change)
 *   npm run vault:migrate -- --apply (writes the changes)
 *
 * Runs on the default database and on every active tenant database. Secrets that can't be
 * opened with VAULT_MASTER_KEY, JWT_SECRET or VAULT_LEGACY_SECRETS are listed and left alone.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { Tenant } from '../models/master/Tenant.js';
import { VaultCredential } from '../models/VaultCredential.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { decryptSecret, encryptSecret, vaultKeyProblem } from '../utils/vaultCrypto.js';

dotenv.config({ override: true });
const apply = process.argv.includes('--apply');

async function migrateCurrentDb(label) {
  const items = await VaultCredential.find().select('+secretCiphertext +secretIv +secretTag +keyVersion title');
  let moved = 0;
  const failed = [];
  for (const item of items) {
    try {
      const { secret, needsRewrap } = decryptSecret({ ciphertext: item.secretCiphertext, iv: item.secretIv, tag: item.secretTag, keyVersion: item.keyVersion });
      if (!needsRewrap) continue;
      moved += 1;
      if (apply) {
        const enc = encryptSecret(secret);
        item.secretCiphertext = enc.ciphertext;
        item.secretIv = enc.iv;
        item.secretTag = enc.tag;
        item.keyVersion = enc.keyVersion;
        await item.save();
      }
    } catch {
      failed.push(item.title);
    }
  }
  console.log(`${label}: ${items.length} credential(s), ${moved} ${apply ? 're-encrypted' : 'to re-encrypt'}, ${failed.length} unreadable${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

const problem = vaultKeyProblem();
if (problem) {
  console.error(problem);
  process.exit(1);
}

await connectDb();
await migrateCurrentDb('default database');
const tenants = await Tenant.find({ status: 'active' });
for (const tenant of tenants) {
  const connection = getTenantDbConnection(tenant.dbName);
  await tenantStorage.run({ connection, tenantId: tenant.tenantId, dbName: tenant.dbName }, () => migrateCurrentDb(`tenant ${tenant.tenantId}`));
}
if (!apply) console.log('\nDry run only. Re-run with --apply to write the changes.');
await mongoose.disconnect();
