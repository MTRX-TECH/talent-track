/**
 * Dynamic Multi-Tenant Context Resolution & Isolation Middleware
 * Binds request-scoped tenant context into AsyncLocalStorage (tenantContextStore)
 */

const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const { runWithTenantContext } = require('../context/tenantContextStore');

const resolveTenantContext = async (req, res, next) => {
  let tenantId = req.headers['x-tenant-id'];

  // If user is authenticated, prefer user's token tenantId unless explicitly impersonating
  if (req.user && req.user.tenantId && !req.isImpersonating) {
    tenantId = req.user.tenantId;
  }

  if (!tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant context is required.' });
  }
  req.tenantId = tenantId;

  const isGlobal = req.tenantId === 'global-mtrx' || (req.user && req.user.role === 'superadmin' && !req.isImpersonating);

  runWithTenantContext({ tenantId, isGlobal, user: req.user }, async () => {
    try {
      if (mongoose.connection.readyState === 1 && req.tenantId !== 'global-mtrx') {
        const tenantDoc = await Tenant.findOne({ slug: tenantId }).catch(() => null);
        if (tenantDoc && tenantDoc.subscription) {
          const status = tenantDoc.subscription.status;
          if (status === 'LOCKED' || status === 'DISABLED') {
            return res.status(403).json({ 
              success: false, 
              message: `Tenant subscription is ${status}. Access is restricted pending settlement confirmation or renewal.` 
            });
          }
        }
      }
      next();
    } catch (err) {
      console.error('[TENANT MIDDLEWARE ERROR]', err.message);
      next();
    }
  });
};

module.exports = resolveTenantContext;
