const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, unique: true, index: true },
    gateway: { type: String, enum: ['razorpay', 'cashfree', 'manual', 'free_premium'], default: 'razorpay' },
    gatewayTransactionId: { type: String, default: '' },
    orderId: { type: String, default: '' },
    amount: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    planCode: { type: String, required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    invoiceNumber: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed', index: true },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    renewalDate: { type: Date, required: true },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
