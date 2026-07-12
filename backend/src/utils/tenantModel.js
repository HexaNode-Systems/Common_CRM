import mongoose from 'mongoose';
import { tenantStorage } from './tenantStorage.js';

export function makeTenantModel(modelName, schema) {
  // Compile on default mongoose connection (fallback/single-tenant mode support)
  const defaultModel = mongoose.model(modelName, schema);

  return new Proxy(defaultModel, {
    get(target, prop, receiver) {
      const store = tenantStorage.getStore();
      const activeConnection = store?.connection;

      if (activeConnection) {
        // Compile/retrieve the model dynamically on the active tenant connection
        const tenantModel = activeConnection.models[modelName] || activeConnection.model(modelName, schema);
        const value = Reflect.get(tenantModel, prop, receiver);
        return typeof value === 'function' ? value.bind(tenantModel) : value;
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    construct(target, argumentsList, newTarget) {
      const store = tenantStorage.getStore();
      const activeConnection = store?.connection;

      if (activeConnection) {
        const tenantModel = activeConnection.models[modelName] || activeConnection.model(modelName, schema);
        return Reflect.construct(tenantModel, argumentsList, tenantModel);
      }
      return Reflect.construct(target, argumentsList, newTarget);
    }
  });
}

