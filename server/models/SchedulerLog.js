const mongoose = require('mongoose');

const schedulerLogSchema = new mongoose.Schema(
  {
    jobType: { type: String, required: true, index: true }, // 'trial_check', 'subscription_check', 'grace_period_purge', 'reminders'
    timestamp: { type: Date, default: Date.now, index: true },
    processedCount: { type: Number, default: 0 },
    actionsTaken: [{ type: String }],
    details: { type: String, default: '' },
    success: { type: Boolean, default: true },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchedulerLog', schedulerLogSchema);
