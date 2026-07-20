const Institution = require('../models/Institution');
const User = require('../models/User');
const Payment = require('../models/Payment');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const SchedulerLog = require('../models/SchedulerLog');

const getBillingAnalytics = async (req, res, next) => {
  try {
    const [institutions, payments, plans] = await Promise.all([
      Institution.find(),
      Payment.find({ status: 'completed' }),
      SubscriptionPlan.find(),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.finalAmount || 0), 0);

    let mrr = 0;
    let arr = 0;
    let activeMonthlySubscribers = 0;
    let activeYearlySubscribers = 0;
    let freePremiumCount = 0;
    let trialCount = 0;
    let gracePeriodCount = 0;

    institutions.forEach(inst => {
      const sub = inst.subscription || {};
      if (sub.freePremiumStatus === 'enabled') {
        freePremiumCount++;
      } else if (sub.trialStatus === 'in_trial') {
        trialCount++;
      } else if (sub.status === 'grace_period') {
        gracePeriodCount++;
      } else if (sub.status === 'active') {
        if (sub.planCode === 'basic') {
          if (sub.billingCycle === 'yearly') { activeYearlySubscribers++; mrr += 500; arr += 6000; }
          else { activeMonthlySubscribers++; mrr += 600; arr += 7200; }
        } else if (sub.planCode === 'standard') {
          if (sub.billingCycle === 'yearly') { activeYearlySubscribers++; mrr += 1000; arr += 12000; }
          else { activeMonthlySubscribers++; mrr += 1200; arr += 14400; }
        } else if (sub.planCode === 'premium') {
          if (sub.billingCycle === 'yearly') { activeYearlySubscribers++; mrr += 1666; arr += 20000; }
          else { activeMonthlySubscribers++; mrr += 2000; arr += 24000; }
        }
      }
    });

    res.json({
      success: true,
      analytics: {
        totalRevenue,
        mrr: Math.round(mrr),
        arr: Math.round(arr),
        activeMonthlySubscribers,
        activeYearlySubscribers,
        freePremiumCount,
        trialCount,
        gracePeriodCount,
        totalInstitutions: institutions.length,
        plans,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getSubscriptionPlansMaster = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ monthlyPrice: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

const updateSubscriptionPlanMaster = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Subscription plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    const schedulerLogs = await SchedulerLog.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, logs, schedulerLogs });
  } catch (err) {
    next(err);
  }
};

const backupDatabase = async (req, res, next) => {
  try {
    const [institutions, users, plans, payments, auditLogs] = await Promise.all([
      Institution.find(),
      User.find(),
      SubscriptionPlan.find(),
      Payment.find(),
      AuditLog.find().limit(500),
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0-Enterprise',
      institutions,
      users,
      plans,
      payments,
      auditLogs,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=talenttrack-backup-${Date.now()}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBillingAnalytics,
  getSubscriptionPlansMaster,
  updateSubscriptionPlanMaster,
  getAuditLogs,
  backupDatabase,
};
