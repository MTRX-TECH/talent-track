const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    institutionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    adminId: { type: String, required: true, index: true },
    adminName: { type: String, default: '' },
    adminEmail: { type: String, default: '' },
    adminMobile: { type: String, default: '' },
    subscription: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
      planCode: { type: String, enum: ['basic', 'standard', 'premium'], default: 'basic' },
      planName: { type: String, default: 'Basic' },
      billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      status: {
        type: String,
        enum: ['active', 'trialing', 'expired', 'grace_period', 'archived', 'disabled'],
        default: 'active',
        index: true,
      },
      trialStatus: {
        type: String,
        enum: ['no_trial', 'in_trial', 'trial_expired'],
        default: 'no_trial',
      },
      trialStartDate: { type: Date, default: null },
      trialEndDate: { type: Date, default: null },
      subscriptionStartDate: { type: Date, default: Date.now },
      subscriptionExpiryDate: { type: Date, required: true },
      gracePeriodStartDate: { type: Date, default: null },
      gracePeriodEndDate: { type: Date, default: null },
      archiveDate: { type: Date, default: null },
      permanentDeletionDate: { type: Date, default: null },
      freePremiumStatus: {
        type: String,
        enum: ['enabled', 'disabled'],
        default: 'disabled',
      },
      sponsoredBy: { type: String, default: 'MTRX TECH' },
      autoRenewal: { type: Boolean, default: false },
      lastPaymentDate: { type: Date, default: null },
      nextRenewalDate: { type: Date, default: null },
      storageUsageBytes: { type: Number, default: 0 },
      maxStudentLimit: { type: Number, default: 100 },
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'suspended', 'pending_deletion'],
      default: 'active',
      index: true,
    },
    createdBy: { type: String, default: 'superadmin' },
    updatedBy: { type: String, default: 'superadmin' },
  },
  { timestamps: true }
);

institutionSchema.index({ tenantId: 1, status: 1 });
institutionSchema.index({ 'subscription.status': 1 });

module.exports = mongoose.model('Institution', institutionSchema);
