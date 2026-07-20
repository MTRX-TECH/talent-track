const Institution = require('../models/Institution');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const { buildSubscriptionConfig } = require('../services/subscriptionService');

const genTenantId = () => `TNT_${Date.now().toString(36).toUpperCase()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const genInstId = () => `INST_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const genAdminId = () => crypto.randomBytes(8).toString('hex');

const getInstitutions = async (req, res, next) => {
  try {
    const { search, status, plan } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (plan) filter['subscription.planCode'] = plan;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { institutionId: new RegExp(search, 'i') },
        { tenantId: new RegExp(search, 'i') },
        { adminEmail: new RegExp(search, 'i') },
      ];
    }

    const institutions = await Institution.find(filter).sort({ createdAt: -1 });

    const totalCount = await Institution.countDocuments();
    const activeCount = await Institution.countDocuments({ status: 'active' });
    const trialCount = await Institution.countDocuments({ 'subscription.trialStatus': 'in_trial' });
    const freePremiumCount = await Institution.countDocuments({ 'subscription.freePremiumStatus': 'enabled' });
    const gracePeriodCount = await Institution.countDocuments({ 'subscription.status': 'grace_period' });

    res.json({
      success: true,
      institutions,
      summary: {
        total: totalCount,
        active: activeCount,
        trialing: trialCount,
        freePremium: freePremiumCount,
        gracePeriod: gracePeriodCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createInstitution = async (req, res, next) => {
  try {
    const {
      name,
      logo,
      address,
      email,
      phone,
      website,
      adminName,
      adminEmail,
      adminMobile,
      password,
      subscriptionPlan = 'basic',
      billingCycle = 'monthly',
      trialOption = 'no_trial', // 'no_trial' | '15_days'
      freePremium = false,
    } = req.body;

    if (!name || !adminEmail || !password) {
      return res.status(400).json({ success: false, error: 'Institution Name, Admin Email, and Password are required.' });
    }

    const existingUser = await User.findOne({ username: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: `Admin username/email '${adminEmail}' already exists.` });
    }

    const tenantId = genTenantId();
    const institutionId = genInstId();
    const adminCustomId = genAdminId();

    const subConfig = await buildSubscriptionConfig({
      planCode: subscriptionPlan,
      billingCycle,
      trialOption,
      freePremium,
    });

    const adminUser = await User.create({
      tenantId,
      institutionId,
      customId: adminCustomId,
      name: adminName || `${name} Admin`,
      username: adminEmail.toLowerCase(),
      email: adminEmail.toLowerCase(),
      mobile: adminMobile || phone || '',
      password,
      role: 'admin',
      domain: 'ADMINISTRATION',
    });

    const institution = await Institution.create({
      tenantId,
      institutionId,
      name,
      logo: logo || '',
      address: address || '',
      email: email || adminEmail,
      phone: phone || adminMobile || '',
      website: website || '',
      adminId: adminCustomId,
      adminName: adminName || adminUser.name,
      adminEmail: adminEmail.toLowerCase(),
      adminMobile: adminMobile || '',
      subscription: subConfig,
      status: 'active',
      createdBy: req.user ? req.user.name : 'superadmin',
    });

    await AuditLog.create({
      tenantId,
      institutionId,
      userId: req.user ? req.user.id : 'superadmin',
      userName: req.user ? req.user.name : 'Super Admin',
      userRole: req.user ? req.user.role : 'superadmin',
      action: 'CREATED_INSTITUTION_AND_ADMIN',
      targetModel: 'Institution',
      targetId: institutionId,
      newValue: { tenantId, institutionId, adminEmail, subscriptionPlan, trialOption, freePremium },
    });

    res.json({
      success: true,
      institution,
      admin: {
        id: adminCustomId,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getInstitutionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inst = await Institution.findOne({ $or: [{ institutionId: id }, { tenantId: id }, { _id: id }] });

    if (!inst) {
      return res.status(404).json({ success: false, error: 'Institution not found' });
    }

    const totalStudents = await User.countDocuments({ tenantId: inst.tenantId, role: 'student' });
    const totalFaculty = await User.countDocuments({ tenantId: inst.tenantId, role: { $in: ['faculty', 'mentor'] } });
    const totalHODs = await User.countDocuments({ tenantId: inst.tenantId, role: 'hod' });

    res.json({
      success: true,
      institution: inst,
      stats: {
        students: totalStudents,
        faculty: totalFaculty,
        hods: totalHODs,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inst = await Institution.findOne({ $or: [{ institutionId: id }, { tenantId: id }] });

    if (!inst) {
      return res.status(404).json({ success: false, error: 'Institution not found' });
    }

    const oldVal = inst.toObject();
    Object.assign(inst, req.body);
    inst.updatedBy = req.user ? req.user.name : 'superadmin';
    await inst.save();

    await AuditLog.create({
      tenantId: inst.tenantId,
      institutionId: inst.institutionId,
      userId: req.user ? req.user.id : 'superadmin',
      userName: req.user ? req.user.name : 'Super Admin',
      userRole: req.user ? req.user.role : 'superadmin',
      action: 'UPDATED_INSTITUTION',
      targetModel: 'Institution',
      targetId: inst.institutionId,
      oldValue: oldVal,
      newValue: inst.toObject(),
    });

    res.json({ success: true, institution: inst });
  } catch (err) {
    next(err);
  }
};

const deleteInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inst = await Institution.findOne({ $or: [{ institutionId: id }, { tenantId: id }] });

    if (!inst) {
      return res.status(404).json({ success: false, error: 'Institution not found' });
    }

    const tId = inst.tenantId;

    // Delete all tenant data atomically
    await Promise.all([
      User.deleteMany({ tenantId: tId }),
      Institution.deleteOne({ tenantId: tId }),
    ]);

    await AuditLog.create({
      tenantId: tId,
      institutionId: inst.institutionId,
      userId: req.user ? req.user.id : 'superadmin',
      userName: req.user ? req.user.name : 'Super Admin',
      userRole: req.user ? req.user.role : 'superadmin',
      action: 'DELETED_INSTITUTION_AND_TENANT_DATA',
      targetModel: 'Institution',
      targetId: inst.institutionId,
      oldValue: { tenantId: tId, name: inst.name },
    });

    res.json({ success: true, message: `Institution ${inst.name} and all tenant data deleted successfully.` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInstitutions,
  createInstitution,
  getInstitutionDetails,
  updateInstitution,
  deleteInstitution,
};
