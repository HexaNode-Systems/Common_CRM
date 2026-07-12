import mongoose from 'mongoose';

const connectionCache = {};

export function getTenantDbConnection(dbName) {
  if (!dbName) {
    throw new Error('Tenant DB name is required');
  }

  // Return cached connection if active
  if (connectionCache[dbName] && connectionCache[dbName].readyState === 1) {
    return connectionCache[dbName];
  }

  // useDb shares the connection pool of the main mongoose connection
  const conn = mongoose.connection.useDb(dbName, { useCache: true, noListener: true });
  connectionCache[dbName] = conn;
  
  return conn;
}
