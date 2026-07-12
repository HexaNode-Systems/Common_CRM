import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage();

export function getTenantConnection() {
  const store = tenantStorage.getStore();
  return store?.connection;
}

export function getTenantId() {
  const store = tenantStorage.getStore();
  return store?.tenantId;
}
