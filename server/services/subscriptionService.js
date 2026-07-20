const SubscriptionPlan = require('../models/SubscriptionPlan');
const Institution = require('../models/Institution');
const AuditLog = require('../models/AuditLog');

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getPlanByCode = async (planCode) => {
  let plan = await SubscriptionPlan.findOne({ planCode, isActive: true });
  if (!plan) {
    // Fallback defaults if DB plan record isn't seeded yet
    const defaults = {
      basic: { planCode: 'basic', name: 'Basic', monthlyPrice: 600, yearlyPrice: 6000, maxStudents: 100, maxStorageMB: 1000 },
      standard: { planCode: 'standard', name: 'Standard', monthlyPrice: 1200, yearlyPrice: 12000, maxStudents: 500, maxStorageMB: 5000 },
      premium: { planCode: 'premium', name: 'Premium', monthlyPrice: 2000, yearlyPrice: 20000, maxStudents: -1, maxStorageMB: -1 },
    };
    plan = defaults[planCode] || defaults.basic;
  }
  return plan;
};

const buildSubscriptionConfig = async ({
  planCode = 'basic',
  billingCycle = 'monthly',
  trialOption = 'no_trial', // 'no_trial' | '15_days'
  freePremium = false,
}) => {
  const plan = await getPlanByCode(planCode);
  const now = new Date();

  if (freePremium) {
    return {
      planCode: 'premium',
      planName: 'Premium',
      billingCycle,
      status: 'active',
      trialStatus: 'no_trial',
      trialStartDate: null,
      trialEndDate: null,
      subscriptionStartDate: now,
      subscriptionExpiryDate: addMonths(now, 120), // 10 years
      gracePeriodStartDate: null,
      gracePeriodEndDate: null,
      archiveDate: null,
      permanentDeletionDate: null,
      freePremiumStatus: 'enabled',
      sponsoredBy: 'MTRX TECH',
      autoRenewal: false,
      lastPaymentDate: now,
      nextRenewalDate: addMonths(now, 120),
      maxStudentLimit: -1,
    };
  }

  if (trialOption === '15_days') {
    const trialEnd = addDays(now, 15);
    const graceEnd = addDays(trialEnd, 7);
    return {
      planCode: 'premium', // Trial institutions receive Premium features
      planName: 'Premium (Trial)',
      billingCycle,
      status: 'trialing',
      trialStatus: 'in_trial',
      trialStartDate: now,
      trialEndDate: trialEnd,
      subscriptionStartDate: now,
      subscriptionExpiryDate: trialEnd,
      gracePeriodStartDate: trialEnd,
      gracePeriodEndDate: graceEnd,
      archiveDate: graceEnd,
      permanentDeletionDate: addDays(graceEnd, 1),
      freePremiumStatus: 'disabled',
      sponsoredBy: '',
      autoRenewal: false,
      lastPaymentDate: null,
      nextRenewalDate: trialEnd,
      maxStudentLimit: -1,
    };
  }

  const expiry = billingCycle === 'yearly' ? addMonths(now, 12) : addMonths(now, 1);
  const graceEnd = addDays(expiry, 7);

  return {
    planCode: plan.planCode,
    planName: plan.name,
    billingCycle,
    status: 'active',
    trialStatus: 'no_trial',
    trialStartDate: null,
    trialEndDate: null,
    subscriptionStartDate: now,
    subscriptionExpiryDate: expiry,
    gracePeriodStartDate: expiry,
    gracePeriodEndDate: graceEnd,
    archiveDate: graceEnd,
    permanentDeletionDate: addDays(graceEnd, 1),
    freePremiumStatus: 'disabled',
    sponsoredBy: '',
    autoRenewal: true,
    lastPaymentDate: now,
    nextRenewalDate: expiry,
    maxStudentLimit: plan.maxStudents,
  };
};

const grantFreePremium = async (institutionId, actorUser) => {
  const inst = await Institution.findOne({ institutionId });
  if (!inst) throw new Error('Institution not found');

  const oldVal = inst.subscription;
  const config = await buildSubscriptionConfig({ planCode: 'premium', freePremium: true });
  inst.subscription = Object.assign({}, inst.subscription, config);
  inst.status = 'active';
  await inst.save();

  await AuditLog.create({
    tenantId: inst.tenantId,
    institutionId: inst.institutionId,
    userId: actorUser ? actorUser.id : 'superadmin',
    userName: actorUser ? actorUser.name : 'Super Admin',
    userRole: actorUser ? actorUser.role : 'superadmin',
    action: 'GRANTED_FREE_PREMIUM',
    targetModel: 'Institution',
    targetId: inst.institutionId,
    oldValue: oldVal,
    newValue: inst.subscription,
  });

  return inst;
};

const revokeFreePremium = async (institutionId, newPlanCode = 'basic', actorUser) => {
  const inst = await Institution.findOne({ institutionId });
  if (!inst) throw new Error('Institution not found');

  const oldVal = inst.subscription;
  const config = await buildSubscriptionConfig({ planCode: newPlanCode, freePremium: false });
  inst.subscription = Object.assign({}, inst.subscription, config);
  await inst.save();

  await AuditLog.create({
    tenantId: inst.tenantId,
    institutionId: inst.institutionId,
    userId: actorUser ? actorUser.id : 'superadmin',
    userName: actorUser ? actorUser.name : 'Super Admin',
    userRole: actorUser ? actorUser.role : 'superadmin',
    action: 'REVOKED_FREE_PREMIUM',
    targetModel: 'Institution',
    targetId: inst.institutionId,
    oldValue: oldVal,
    newValue: inst.subscription,
  });

  return inst;
};

module.exports = {
  addMonths,
  addDays,
  getPlanByCode,
  buildSubscriptionConfig,
  grantFreePremium,
  revokeFreePremium,
};
