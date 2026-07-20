const tenantMiddleware = (req, res, next) => {
  try {
    const headerTenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (req.user) {
      if (req.user.role === 'superadmin') {
        req.tenantId = headerTenantId || req.user.tenantId || 'TNT_GLOBAL';
        req.isSuperAdminQuery = true;
      } else {
        req.tenantId = req.user.tenantId || 'TNT_DEFAULT';
        req.institutionId = req.user.institutionId || 'INST_DEFAULT';
        req.isSuperAdminQuery = false;
      }
    } else {
      req.tenantId = headerTenantId || 'TNT_DEFAULT';
      req.isSuperAdminQuery = false;
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = tenantMiddleware;
