const jwt = require('jsonwebtoken');
const { getTenantContext } = require('../context/tenantContextStore');

const JWT_SECRET = process.env.JWT_SECRET || 'talenttrack-production-super-secret-key-2026';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    if (decoded.impersonatedBy) {
      req.isImpersonating = true;
      req.impersonatedBy = decoded.impersonatedBy;
    }

    if (!decoded.tenantId) {
      return res.status(403).json({ success: false, message: 'Invalid token: missing tenant context.' });
    }
    
    // Unconditionally overwrite any forged header with the cryptographically verified JWT claim
    req.tenantId = decoded.tenantId;
    
    const ctx = getTenantContext();
    if (ctx) {
      ctx.tenantId = decoded.tenantId;
      ctx.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

module.exports = authMiddleware;
