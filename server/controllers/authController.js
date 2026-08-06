const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dataService = require('../services/dataService');
const PlatformSettings = require('../models/PlatformSettings');
const Tenant = require('../models/Tenant');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'talenttrack-production-super-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'talenttrack-production-super-refresh-key-2026';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username/email and password.' });
    }

    const settings = await dataService.findOne('platformSettings', { singletonKey: 'GLOBAL_SETTINGS', bypassTenantScope: true });
    
    // We will enforce maintenance mode later down, after we fetch the user to see if they are a superadmin.

    const tenantId = req.tenantId || 'tenant-rit';

    // 1. Try global lookup for superadmin only
    let user = await dataService.findOne('users', {
      $or: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() }
      ],
      role: 'superadmin',
      bypassTenantScope: true
    });

    // 2. If not a superadmin, lookup globally so they can log into their specific tenant
    if (!user) {
      user = await dataService.findOne('users', {
        $or: [
          { username: username.trim() },
          { email: username.trim().toLowerCase() }
        ],
        bypassTenantScope: true
      });
    }


    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    if (settings && settings.maintenanceMode && user.role !== 'superadmin') {
      return res.status(503).json({ success: false, message: 'Platform under maintenance. Logins are temporarily disabled.' });
    }

    if (user.role !== 'superadmin') {
      const activeTenant = await dataService.findOne('tenants', { slug: user.tenantId, bypassTenantScope: true });
      if (activeTenant && activeTenant.subscription && activeTenant.subscription.status === 'pending_deletion') {
        return res.status(403).json({ success: false, message: 'Institution account is pending deletion. Logins are blocked.' });
      }
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = bcrypt.compareSync(password, user.passwordHash);
    }

    // Direct password check fallback for seeded test users removed for security

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const payload = {
      id: user._id || user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || tenantId,
      departmentCode: user.departmentCode || 'CSE',
      studentId: user.studentId || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ id: payload.id, tenantId: payload.tenantId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Log Audit Event
    await dataService.create('auditLogs', {
      tenantId: payload.tenantId,
      actorName: user.name,
      action: 'USER_LOGIN',
      resource: 'AuthService',
      details: `User ${user.email} logged in successfully.`
    }).catch(() => null);

    res.json({
      success: true,
      token,
      user: {
        id: payload.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: payload.tenantId,
        departmentCode: user.departmentCode,
        studentId: user.studentId,
        needsPasswordChange: user.needsPasswordChange || false,
        needsParentLogin: user.needsParentLogin || false
      }
    });
  } catch (err) {
    console.error('[AUTH_ERROR] Login failure:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Login server error: ' + err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies.refreshToken : null;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await dataService.findOne('users', { _id: decoded.id });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User session invalid.' });
    }

    const payload = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      departmentCode: user.departmentCode,
      needsPasswordChange: user.needsPasswordChange || false,
      needsParentLogin: user.needsParentLogin || false
    };

    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token: newToken, user: payload });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await dataService.findOne('users', { _id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    let updated = await dataService.updateOne('users', { _id: req.user.id, bypassRoleScope: true }, { passwordHash, needsPasswordChange: false }, req.tenantId);
    if (!updated) {
      updated = await dataService.updateOne('users', { id: req.user.id, bypassRoleScope: true }, { passwordHash, needsPasswordChange: false }, req.tenantId);
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User record not found for password reset.' });
    }

    await dataService.create('auditLogs', {
      tenantId: req.tenantId || req.user.tenantId || 'global',
      actorId: String(req.user.id || req.user._id || 'unknown'),
      actorName: req.user.name || req.user.email || 'User',
      action: 'PASSWORD_RESET',
      resource: 'AuthService',
      details: `User ${req.user.email} successfully updated their password.`
    }).catch(() => null);

    res.json({ success: true, message: 'Password updated successfully.', user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await dataService.findOne('users', { email: email.trim().toLowerCase(), bypassTenantScope: true });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found with this email address.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await dataService.updateOne('users', { _id: user._id, bypassTenantScope: true }, { resetOtp: otp, resetOtpExpiry: expiry }, 'global');

    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"TalentTrack Support" <noreply@talenttrack.com>',
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`
      }).catch(console.error);
    } else {
      console.log(`\n\n[DEV_MODE] OTP for ${user.email} is: ${otp}\n\n`);
    }

    res.json({ success: true, message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPasswordDirect = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password (min 6 chars) are required.' });
    }

    const user = await dataService.findOne('users', { email: email.trim().toLowerCase(), bypassTenantScope: true });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found with this email address.' });

    if (!user.resetOtp || user.resetOtp !== otp || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    
    // Update their password and clear OTP
    await dataService.updateOne('users', { _id: user._id, bypassTenantScope: true }, { passwordHash, resetOtp: null, resetOtpExpiry: null }, 'global');
    
    // Log the action
    await dataService.create('auditLogs', {
      tenantId: user.tenantId || 'global',
      actorId: user._id,
      actorName: user.username || user.email || 'User',
      action: 'DIRECT_PASSWORD_RESET',
      resource: 'AuthService',
      details: `User ${user.email} directly reset their password with email OTP verification.`
    }).catch(() => null);

    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
