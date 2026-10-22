import { seedLeadFromJustdialPayload } from '../controllers/lead.controller.js';
import { readIntegrationSettings } from '../controllers/settings.controller.js';
import { Tenant } from '../models/master/Tenant.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';

/*
 * Justdial lead polling, two ways:
 *  1. Integrations page: each company that switches Justdial polling on with a poll URL is
 *     polled at its own interval (checked every minute).
 *  2. .env (as before): JUSTDIAL_POLL_URL / JUSTDIAL_API_TOKEN / JUSTDIAL_POLL_INTERVAL_MS,
 *     into JUSTDIAL_TENANT_ID (or the default database).
 */

const TICK_MS = 60000;
let envTimer = null;
let settingsTimer = null;
const lastRun = new Map(); // tenant key -> time of last poll

function extractLeadBatch(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.leads)) return payload.leads;
  if (Array.isArray(payload?.data)) return payload.data;
  return [payload];
}

async function pollOnce(url, token, label) {
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) {
    console.error(`Justdial polling (${label}): HTTP ${response.status}`);
    return;
  }
  const payload = await response.json();
  for (const item of extractLeadBatch(payload)) {
    try {
      await seedLeadFromJustdialPayload(item);
    } catch (error) {
      console.error(`Justdial lead skipped (${label}):`, error.message);
    }
  }
}

function inTenant(tenant, fn) {
  if (!tenant) return fn();
  const connection = getTenantDbConnection(tenant.dbName);
  return tenantStorage.run({ connection, tenantId: tenant.tenantId, dbName: tenant.dbName }, fn);
}

/* ---------- 1. Settings-based polling ---------- */

async function pollFromSettings() {
  let tenants = [];
  try {
    tenants = await Tenant.find({ status: 'active' }).select('tenantId dbName');
  } catch {
    tenants = [];
  }
  // Single-company installs keep their settings in the default database.
  const targets = tenants.length ? tenants : [null];

  for (const tenant of targets) {
    const key = tenant?.tenantId || 'default';
    try {
      await inTenant(tenant, async () => {
        const { justdial } = await readIntegrationSettings();
        if (!justdial?.isActive || !justdial.pollUrl) return;
        // The .env poller already covers this company with the same URL.
        if (process.env.JUSTDIAL_POLL_URL === justdial.pollUrl && (process.env.JUSTDIAL_TENANT_ID || 'default') === key) return;
        const every = Math.max(Number(justdial.pollIntervalMs) || 300000, 60000);
        if (Date.now() - (lastRun.get(key) || 0) < every) return;
        lastRun.set(key, Date.now());
        await pollOnce(justdial.pollUrl, justdial.apiToken, key);
      });
    } catch (error) {
      console.error(`Justdial polling (${key}) failed:`, error.message);
    }
  }
}

/* ---------- 2. .env polling (unchanged behaviour) ---------- */

async function envTenant() {
  const tenantId = process.env.JUSTDIAL_TENANT_ID;
  if (!tenantId) return null;
  const tenant = await Tenant.findOne({ tenantId: String(tenantId).toLowerCase(), status: 'active' });
  if (!tenant) throw new Error(`tenant "${tenantId}" not found or not active`);
  return tenant;
}

function startEnvPolling() {
  const url = process.env.JUSTDIAL_POLL_URL;
  if (!url || envTimer) return;
  if (!process.env.JUSTDIAL_TENANT_ID) {
    console.warn('Justdial polling: JUSTDIAL_TENANT_ID is not set, leads will be saved to the default database.');
  }
  const intervalMs = Math.max(Number(process.env.JUSTDIAL_POLL_INTERVAL_MS || 300000), 60000);
  const run = async () => {
    try {
      const tenant = await envTenant();
      await inTenant(tenant, () => pollOnce(url, process.env.JUSTDIAL_API_TOKEN, tenant?.tenantId || 'default'));
    } catch (error) {
      console.error('Justdial polling failed:', error.message);
    }
  };
  void run();
  envTimer = setInterval(run, intervalMs);
}

export function startJustdialLeadPolling() {
  startEnvPolling();
  if (!settingsTimer) {
    settingsTimer = setInterval(() => { void pollFromSettings(); }, TICK_MS);
    void pollFromSettings();
  }
}

export function stopJustdialLeadPolling() {
  if (envTimer) clearInterval(envTimer);
  if (settingsTimer) clearInterval(settingsTimer);
  envTimer = null;
  settingsTimer = null;
}
