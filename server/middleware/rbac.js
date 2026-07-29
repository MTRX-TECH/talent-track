/**
 * Role-Based (RBAC) & Attribute-Based (ABAC) Access Control Middleware
 */

const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // SuperAdmin has global bypass authority
    if (req.user.role === 'superadmin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${req.user.role}' lacks authorization for this endpoint.` 
      });
    }

    next();
  };
};

module.exports = checkRole;
