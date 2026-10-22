import { api } from '../api/client.js';

/**
 * Downloads a private file with the user's login token and saves it under `fileName`.
 * `path` is relative to the API base, e.g. "/v1/storage/<id>/download".
 */
export async function downloadFile(path, fileName) {
  const { data } = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Server message from a failed blob request (the error body is a Blob, not JSON). */
export async function downloadError(err, fallback = 'Unable to download the file.') {
  const body = err?.response?.data;
  if (body instanceof Blob) {
    try {
      return JSON.parse(await body.text()).message || fallback;
    } catch {
      return fallback;
    }
  }
  return body?.message || fallback;
}
