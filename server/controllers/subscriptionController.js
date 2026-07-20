const SubscriptionPlan = require('../models/SubscriptionPlan');
const Institution = require('../models/Institution');
const { grantFreePremium, revokeFreePremium, buildSubscriptionConfig } = require('../services/subscriptionService');

const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ monthlyPrice: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

const getCurrentSubscription = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || (req.user ? req.user.tenantId : 'TNT_GLOBAL');
    const inst = await Institution.findOne({ tenantId });

    if (!inst) {
      return res.json({
        success: true,
        subscription: {
          planCode: 'premium',
          planName: 'Global SuperAdmin',
          status: 'active',
          freePremiumStatus: 'enabled',
          sponsoredBy: 'MTRX TECH',
          daysRemaining: 9999,
        },
      });
    }

    const now = new Date();
    const expiryDate = new Date(inst.subscription.subscriptionExpiryDate || Date.now());
    const daysRemaining = Math.max(0, Math.ceil((expiryDate - now) / 86400000));

    res.json({
      success: true,
      institutionId: inst.institutionId,
      tenantId: inst.tenantId,
      institutionName: inst.name,
      subscription: inst.subscription,
      daysRemaining,
    });
  } catch (err) {
    next(err);
  }
};

const handleGrantFreePremium = async (req, res, next) => {
  try {
    const { institutionId } = req.body;
    const inst = await grantFreePremium(institutionId, req.user);
    res.json({ success: true, message: `Free Premium granted to ${inst.name}`, subscription: inst.subscription });
  } catch (err) {
    next(err);
  }
};

const handleRevokeFreePremium = async (req, res, next) => {
  try {
    const { institutionId, newPlanCode = 'basic' } = req.body;
    const inst = await revokeFreePremium(institutionId, newPlanCode, req.user);
    res.json({ success: true, message: `Free Premium revoked for ${inst.name}`, subscription: inst.subscription });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSubscriptionPlans,
  getCurrentSubscription,
  handleGrantFreePremium,
  handleRevokeFreePremium,
};
