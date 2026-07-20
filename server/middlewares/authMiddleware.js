const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // If request comes from legacy frontend query params or custom header, try that
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_talenttrack_enterprise_2026');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found or session invalid' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, error: 'Account suspended. Contact Super Admin.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_talenttrack_enterprise_2026');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // ignore optional auth errors
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
