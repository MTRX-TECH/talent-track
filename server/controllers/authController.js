const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'supersecretjwtkey_talenttrack_enterprise_2026',
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

const isRoleAllowedForLogin = (userRole, loginRole) => {
  uRole = String(userRole || '').toLowerCase();
  lRole = String(loginRole || '').toLowerCase();
  if (!lRole) return true;
  if (lRole === 'admin') return uRole === 'admin' || uRole === 'superadmin' || uRole === 'hod';
  return uRole === lRole;
};

const login = async (req, res, next) => {
  try {
    const { username, password, selectedRole, loginRole } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, error: 'Account has been suspended.' });
    }

    const targetRole = String(loginRole || selectedRole || '').toLowerCase();
    if (targetRole && !isRoleAllowedForLogin(user.role, targetRole)) {
      let roleMsg = `This account is registered as '${user.role.toUpperCase()}', not '${targetRole.toUpperCase()}'.`;
      return res.status(403).json({ success: false, error: roleMsg });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({ token: refreshToken, userId: user._id.toString(), expiresAt });

    // Log activity
    await ActivityLog.create({
      userId: user.customId || user._id.toString(),
      userName: user.name,
      role: user.role,
      action: 'LOGIN',
      details: `User logged in as ${user.role}`,
      ipAddress: req.ip || '',
    });

    const userData = user.toJSON();
    userData.token = accessToken;
    userData.refreshToken = refreshToken;

    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh Token required' });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user || user.isSuspended) {
      return res.status(401).json({ success: false, error: 'User unavailable or suspended' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({ token: newRefreshToken, userId: user._id.toString(), expiresAt });

    res.json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true });
    }
    if (req.user) {
      await ActivityLog.create({
        userId: req.user.customId || req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'LOGOUT',
        details: 'User logged out',
        ipAddress: req.ip || '',
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { userId, currentPassword, newPassword, skipVerify } = req.body;
    const targetUserId = userId || (req.user && req.user.id);

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'userId required.' });
    }
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password required.' });
    }

    const user = await User.findOne({
      $or: [{ _id: targetUserId.match(/^[0-9a-fA-F]{24}$/) ? targetUserId : null }, { customId: targetUserId }],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (currentPassword !== undefined && String(skipVerify) !== 'true') {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user.toJSON() });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refreshTokenHandler, logout, changePassword, getMe };
