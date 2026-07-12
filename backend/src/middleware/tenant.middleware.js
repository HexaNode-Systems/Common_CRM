import jwt from 'jsonwebtoken';
import { tenantStorage } from '../utils/tenantStorage.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { Tenant } from '../models/master/Tenant.js';

export const tenantContextMiddleware = async (req, res, next) => {
  let tenantId = null;
  let dbName = null;

  // 1. Try to extract tenant from JWT token (for authenticated requests)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.dbName) {
        dbName = decoded.dbName;
        tenantId = decoded.tenantId;
      }
    } catch (err) {
      // Invalid or expired token; will be handled by protect middleware if required
    }
  }

  // 2. Fallback: Resolve via custom header or subdomain (for public pages like theme settings or landing page)
  if (!dbName) {
    const headerTenantId = req.headers['x-tenant-id'];
    if (headerTenantId) {
      try {
        const tenant = await Tenant.findOne({ tenantId: headerTenantId });
        if (tenant) {
          tenantId = tenant.tenantId;
          dbName = tenant.dbName;
          req.tenant = tenant;
        }
      } catch (err) {
        console.error('Error looking up tenant by header:', err);
      }
    } else {
      // Resolve via subdomain (e.g. tenant1.domain.com)
      const host = req.headers.host || '';
      const parts = host.split('.');
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
        const subdomain = parts[0];
        try {
          const tenant = await Tenant.findOne({ subdomain });
          if (tenant) {
            tenantId = tenant.tenantId;
            dbName = tenant.dbName;
            req.tenant = tenant;
          }
        } catch (err) {
          console.error('Error looking up tenant by subdomain:', err);
        }
      }
    }
  }

  // 3. Bind connection to AsyncLocalStorage if resolved
  if (dbName) {
    try {
      const connection = getTenantDbConnection(dbName);
      
      return tenantStorage.run({ connection, tenantId, dbName }, () => {
        req.tenantId = tenantId;
        req.tenantDbName = dbName;
        req.tenantConnection = connection;
        next();
      });
    } catch (err) {
      console.error(`Failed to activate database connection for tenant DB: ${dbName}`, err);
      return res.status(500).json({ message: 'Internal Server Error: Database routing failed' });
    }
  }

  // No tenant context (global platform/super admin operations)
  next();
};
