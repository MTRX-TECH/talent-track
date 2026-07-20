const cron = require('node-cron');
const Institution = require('../models/Institution');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const SchedulerLog = require('../models/SchedulerLog');

const runDailySubscriptionLifecycleJob = async () => {
  const now = new Date();
  console.log(`[Scheduler] Running daily subscription lifecycle check at ${now.toISOString()}...`);
  const actionsTaken = [];
  let processedCount = 0;

  try {
    // 1. Check Trial Expiries
    const expiredTrials = await Institution.find({
      'subscription.trialStatus': 'in_trial',
      'subscription.trialEndDate': { $lte: now },
      status: { $ne: 'disabled' },
    });

    for (const inst of expiredTrials) {
      processedCount++;
      const graceEnd = new Date(now.getTime() + 7 * 86400000);

      inst.subscription.trialStatus = 'trial_expired';
      inst.subscription.status = 'grace_period';
      inst.subscription.gracePeriodStartDate = now;
      inst.subscription.gracePeriodEndDate = graceEnd;
      inst.subscription.permanentDeletionDate = new Date(graceEnd.getTime() + 86400000);
      inst.status = 'disabled';
      await inst.save();

      // Disable all users belonging to this tenant
      await User.updateMany({ tenantId: inst.tenantId }, { $set: { status: 'disabled', isSuspended: true } });

      const msg = `Trial expired for tenant ${inst.tenantId} (${inst.name}). Institution disabled. Entered 7-day grace period.`;
      actionsTaken.push(msg);

      await Notification.create({
        tenantId: inst.tenantId,
        institutionId: inst.institutionId,
        userId: inst.adminId,
        message: 'Your 15-day free trial has expired. Your account is in a 7-day grace period. Activate a plan to restore access.',
        type: 'subscription',
      });
    }

    // 2. Check Subscription Expiries (Non-trial)
    const expiredSubs = await Institution.find({
      'subscription.status': 'active',
      'subscription.freePremiumStatus': { $ne: 'enabled' },
      'subscription.subscriptionExpiryDate': { $lte: now },
    });

    for (const inst of expiredSubs) {
      processedCount++;
      const graceEnd = new Date(now.getTime() + 7 * 86400000);

      inst.subscription.status = 'grace_period';
      inst.subscription.gracePeriodStartDate = now;
      inst.subscription.gracePeriodEndDate = graceEnd;
      inst.subscription.permanentDeletionDate = new Date(graceEnd.getTime() + 86400000);
      inst.status = 'disabled';
      await inst.save();

      await User.updateMany({ tenantId: inst.tenantId }, { $set: { status: 'disabled', isSuspended: true } });

      const msg = `Subscription expired for tenant ${inst.tenantId} (${inst.name}). Entered 7-day grace period.`;
      actionsTaken.push(msg);

      await Notification.create({
        tenantId: inst.tenantId,
        institutionId: inst.institutionId,
        userId: inst.adminId,
        message: 'Your subscription has expired. You have entered a 7-day grace period. Renew now to prevent permanent deletion.',
        type: 'subscription',
      });
    }

    // 3. Renewal Reminders (7 days, 3 days, 1 day before expiry)
    const upcomingExpiries = await Institution.find({
      'subscription.status': 'active',
      'subscription.freePremiumStatus': { $ne: 'enabled' },
    });

    for (const inst of upcomingExpiries) {
      const diffDays = Math.ceil((new Date(inst.subscription.subscriptionExpiryDate) - now) / 86400000);
      if ([30, 15, 7, 3, 1].includes(diffDays)) {
        await Notification.create({
          tenantId: inst.tenantId,
          institutionId: inst.institutionId,
          userId: inst.adminId,
          message: `Reminder: Your ${inst.subscription.planName} subscription expires in ${diffDays} day(s). Renew to avoid disruption.`,
          type: 'subscription',
        });
        actionsTaken.push(`Sent ${diffDays}-day renewal reminder to ${inst.tenantId}`);
      }
    }

    // 4. Grace Period Expiry -> AUTOMATIC PERMANENT DELETION (Day 7)
    const gracePeriodExpired = await Institution.find({
      'subscription.status': 'grace_period',
      'subscription.gracePeriodEndDate': { $lte: now },
    });

    for (const inst of gracePeriodExpired) {
      processedCount++;
      const tId = inst.tenantId;

      console.log(`[Scheduler] AUTOMATIC PERMANENT DELETION EXECUTING FOR TENANT ${tId} (${inst.name})...`);

      // Atomically purge all tenant collections
      const [uDel, attDel, msDel, gDel, dDel, cDel, pDel, invDel, nDel, actDel, audDel] = await Promise.all([
        User.deleteMany({ tenantId: tId }),
        Attendance.deleteMany({ tenantId: tId }),
        Milestone.deleteMany({ tenantId: tId }),
        Goal.deleteMany({ tenantId: tId }),
        Department.deleteMany({ tenantId: tId }),
        Course.deleteMany({ tenantId: tId }),
        Payment.deleteMany({ tenantId: tId }),
        Invoice.deleteMany({ tenantId: tId }),
        Notification.deleteMany({ tenantId: tId }),
        ActivityLog.deleteMany({ tenantId: tId }),
        AuditLog.deleteMany({ tenantId: tId }),
      ]);

      await Institution.deleteOne({ tenantId: tId });

      const msg = `PERMANENTLY DELETED TENANT ${tId} (${inst.name}) after 7-day grace period. Purged: ${uDel.deletedCount} Users, ${msDel.deletedCount} Milestones, ${pDel.deletedCount} Payments.`;
      actionsTaken.push(msg);

      console.log(`[Scheduler] ${msg}`);
    }

    // Record scheduler execution log
    await SchedulerLog.create({
      jobType: 'daily_subscription_lifecycle',
      processedCount,
      actionsTaken,
      details: `Processed ${processedCount} institutions. Executed ${actionsTaken.length} actions.`,
      success: true,
    });
  } catch (err) {
    console.error('[Scheduler Error]', err);
    await SchedulerLog.create({
      jobType: 'daily_subscription_lifecycle',
      processedCount,
      actionsTaken,
      details: 'Failed during execution',
      success: false,
      error: err.message,
    });
  }
};

const startScheduler = () => {
  // Run once immediately on boot
  runDailySubscriptionLifecycleJob();

  // Schedule daily run at 00:00 (midnight UTC)
  cron.schedule('0 0 * * *', () => {
    runDailySubscriptionLifecycleJob();
  });
};

module.exports = {
  startScheduler,
  runDailySubscriptionLifecycleJob,
};
