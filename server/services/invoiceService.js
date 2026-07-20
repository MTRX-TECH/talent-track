const Invoice = require('../models/Invoice');
const crypto = require('crypto');

const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-MTRX-${dateStr}-${rand}`;
};

const createInvoiceFromPayment = async (payment, institution) => {
  const invoiceNumber = generateInvoiceNumber();
  const subtotal = payment.amount;
  const gstAmount = payment.gst || Math.round(subtotal * 0.18); // 18% GST standard
  const totalAmount = subtotal + gstAmount - (payment.discount || 0);

  const invoice = await Invoice.create({
    tenantId: payment.tenantId,
    institutionId: payment.institutionId,
    invoiceNumber,
    paymentId: payment.paymentId,
    institutionName: institution ? institution.name : 'Educational Institution',
    billingDetails: {
      address: institution ? institution.address : '',
      email: institution ? institution.email : '',
      phone: institution ? institution.phone : '',
      gstin: '',
    },
    items: [
      {
        description: `TalentTrack Enterprise SaaS — ${payment.planCode.toUpperCase()} Plan (${payment.billingCycle})`,
        planCode: payment.planCode,
        billingCycle: payment.billingCycle,
        amount: subtotal,
      },
    ],
    subtotal,
    gstAmount,
    discountAmount: payment.discount || 0,
    totalAmount,
    paymentMethod: payment.gateway || 'Razorpay',
    transactionId: payment.gatewayTransactionId || payment.paymentId,
    paymentDate: payment.purchaseDate || new Date(),
    nextRenewalDate: payment.renewalDate,
    status: 'paid',
    pdfUrl: `/api/payments/invoice/${invoiceNumber}/download`,
  });

  return invoice;
};

module.exports = {
  generateInvoiceNumber,
  createInvoiceFromPayment,
};
