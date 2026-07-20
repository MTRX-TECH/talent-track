const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planCode: { type: String, required: true, unique: true, enum: ['basic', 'standard', 'premium'] },
    name: { type: String, required: true },
    monthlyPrice: { type: Number, required: true },
    yearlyPrice: { type: Number, required: true },
    monthlySavings: { type: Number, default: 0 },
    yearlySavings: { type: Number, default: 0 },
    maxStudents: { type: Number, required: true }, // -1 for unlimited
    maxStorageMB: { type: Number, required: true }, // -1 for unlimited
    features: [{ type: String }],
    isCustom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
