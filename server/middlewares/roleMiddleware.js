const ROLE_RANKS = {
  superadmin: 5,
  admin: 4,
  hod: 3,
  mentor: 2,
  student: 1,
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userRole = req.user.role.toLowerCase();

    // SuperAdmin always has full access
    if (userRole === 'superadmin') {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Role '${req.user.role}' is not authorized to access this resource`,
    });
  };
};

const minRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userRank = ROLE_RANKS[req.user.role.toLowerCase()] || 0;
    const requiredRank = ROLE_RANKS[requiredRole.toLowerCase()] || 0;

    if (userRank >= requiredRank) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Minimum role required: ${requiredRole}`,
    });
  };
};

module.exports = { authorize, minRole };
