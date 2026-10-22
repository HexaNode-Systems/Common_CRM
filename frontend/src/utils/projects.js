import { api } from '../api/client.js';

export const PROJECT_STATUSES = ['Pipeline', 'Running', 'Finished', 'Blocked'];

// Must match CURRENCIES in backend/src/controllers/project.controller.js
export const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'AED', symbol: 'AED' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' }
];

export const DOC_CATEGORIES = [
  { value: 'agreement', label: 'Agreement / Contract' },
  { value: 'prd', label: 'PRD (Product Requirement Document)' },
  { value: 'invoice', label: 'Invoice / Financial Record' },
  { value: 'other', label: 'Other Attachments' }
];

// Must match ALLOWED_EXTENSIONS on the server and the 5 MB multer limit.
export const ALLOWED_DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'png', 'jpg', 'jpeg', 'webp', 'zip'];
export const MAX_DOC_SIZE = 5 * 1024 * 1024;
export const MAX_DOCS_PER_UPLOAD = 10;

export function currencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code || '';
}

export function categoryLabel(value) {
  return DOC_CATEGORIES.find((c) => c.value === value)?.label || value || 'Other';
}

// Never throws: an unknown currency code in old data falls back to "CODE 1,234".
export function formatMoney(amount, currency = 'INR') {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${currency || ''} ${value.toLocaleString('en-IN')}`.trim();
  }
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(date);
}

export function initials(name = '') {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

/** Returns an error message for a file the server would reject, or '' when it is fine. */
export function checkDocumentFile(file) {
  const ext = String(file.name).split('.').pop().toLowerCase();
  if (!file.name.includes('.') || !ALLOWED_DOC_EXTENSIONS.includes(ext)) return `${file.name}: file type not allowed.`;
  if (file.size > MAX_DOC_SIZE) return `${file.name}: larger than 5 MB.`;
  return '';
}

/**
 * Documents are private, so they are fetched with the user's token and saved from a blob.
 * Works the same whatever host the API runs on.
 */
export async function downloadProjectDocument(projectId, doc) {
  const { data } = await api.get(`/catalog/${projectId}/documents/${encodeURIComponent(doc.filename)}`, {
    responseType: 'blob'
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.originalName || doc.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Error text from a failed blob request (the body is a Blob, not JSON). */
export async function blobErrorMessage(err, fallback = 'Unable to download the document.') {
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
