const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, required: true },
    institutionName: { type: String, required: true },
    billingDetails: {
      address: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '' },
    },
    items: [
      {
        description: { type: String, required: true },
        planCode: { type: String, required: true },
        billingCycle: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Razorpay' },
    transactionId: { type: String, default: '' },
    paymentDate: { type: Date, default: Date.now },
    nextRenewalDate: { type: Date },
    status: { type: String, enum: ['paid', 'unpaid', 'cancelled'], default: 'paid' },
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
