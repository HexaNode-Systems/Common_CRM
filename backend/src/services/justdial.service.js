import { seedLeadFromJustdialPayload } from '../controllers/lead.controller.js';

let pollerId = null;

function extractLeadBatch(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.leads)) return payload.leads;
  if (Array.isArray(payload?.data)) return payload.data;
  return [payload];
}

export function startJustdialLeadPolling() {
  const url = process.env.JUSTDIAL_POLL_URL;
  if (!url || pollerId) return;

  const intervalMs = Math.max(Number(process.env.JUSTDIAL_POLL_INTERVAL_MS || 300000), 60000);

  const run = async () => {
    try {
      const response = await fetch(url, {
        headers: process.env.JUSTDIAL_API_TOKEN ? { Authorization: `Bearer ${process.env.JUSTDIAL_API_TOKEN}` } : undefined
      });

      if (!response.ok) return;
      const payload = await response.json();
      for (const item of extractLeadBatch(payload)) {
        await seedLeadFromJustdialPayload(item);
      }
    } catch (error) {
      console.error('Justdial polling failed:', error.message);
    }
  };

  void run();
  pollerId = setInterval(run, intervalMs);
}

export function stopJustdialLeadPolling() {
  if (pollerId) clearInterval(pollerId);
  pollerId = null;
}