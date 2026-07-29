const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  cname: { type: String, default: null },
  subscription: {
    status: { 
      type: String, 
      enum: ['ACTIVE', 'TRIAL', 'EXPIRED', 'LOCKED', 'DISABLED', 'pending_deletion'], 
      default: 'TRIAL' 
    },
    plan: { type: String, enum: ['Basic', 'Standard', 'Premium', 'Enterprise Gold'], default: 'Standard' },
    trialExpiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) },
    gracePeriodExpiresAt: { type: Date },
    paidAmount: { type: Number, default: 0 },
    settlementStatus: { type: String, enum: ['INITIATED', 'SETTLED', 'FORCED'], default: 'SETTLED' },
    paymentStatus: { type: String, enum: ['pending', 'settled', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null }
  },
  branding: {
    primaryColor: { type: String, default: '#7c3aed' },
    logoUrl: { type: String, default: '' },
    institutionName: { type: String, default: '' }
  },
  // Task 3: Tenant Configurable PRS Weights
  prsWeights: {
    milestones: { type: Number, default: 40 },
    internships: { type: Number, default: 30 },
    academics: { type: Number, default: 20 },
    softSkills: { type: Number, default: 0 },
    leadership: { type: Number, default: 10 }
  },
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    averagePRS: { type: Number, default: 0 }
  }
}, { timestamps: true });

TenantSchema.index({ 'subscription.status': 1 });

module.exports = mongoose.model('Tenant', TenantSchema);
