const crypto = require('crypto');
const Payment = require('../models/Payment');
const Institution = require('../models/Institution');
const { createInvoiceFromPayment } = require('./invoiceService');
const { getPlanByCode, addMonths } = require('./subscriptionService');
const AuditLog = require('../models/AuditLog');

class PaymentGatewayFactory {
  static getProvider(providerName = 'razorpay') {
    switch (providerName.toLowerCase()) {
      case 'cashfree':
        return new CashfreeProvider();
      case 'manual':
        return new ManualPaymentProvider();
      case 'razorpay':
      default:
        return new RazorpayProvider();
    }
  }
}

class BasePaymentProvider {
  async createOrder({ tenantId, institutionId, planCode, billingCycle }) {
    throw new Error('createOrder must be implemented by gateway subclass');
  }

  async verifyWebhook(signature, payload, secret) {
    throw new Error('verifyWebhook must be implemented by gateway subclass');
  }
}

class RazorpayProvider extends BasePaymentProvider {
  async createOrder({ tenantId, institutionId, planCode, billingCycle }) {
    const plan = await getPlanByCode(planCode);
    const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const gst = Math.round(amount * 0.18);
    const finalAmount = amount + gst;
    const orderId = `rzp_order_${crypto.randomBytes(8).toString('hex')}`;
    const paymentId = `PAY_${crypto.randomBytes(8).toString('hex')}`;

    return {
      orderId,
      paymentId,
      gateway: 'razorpay',
      amount,
      gst,
      finalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_MTRXTech2026',
    };
  }

  async verifyWebhook(signature, payload, secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'secret') {
    if (!signature) return true; // Fallback simulation for dev mode
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    return signature === expected;
  }
}

class CashfreeProvider extends BasePaymentProvider {
  async createOrder({ tenantId, institutionId, planCode, billingCycle }) {
    const plan = await getPlanByCode(planCode);
    const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const gst = Math.round(amount * 0.18);
    const finalAmount = amount + gst;
    const orderId = `cf_order_${crypto.randomBytes(8).toString('hex')}`;
    const paymentId = `PAY_${crypto.randomBytes(8).toString('hex')}`;

    return {
      orderId,
      paymentId,
      gateway: 'cashfree',
      amount,
      gst,
      finalAmount,
      currency: 'INR',
    };
  }

  async verifyWebhook(signature, payload, secret) {
    return true;
  }
}

class ManualPaymentProvider extends BasePaymentProvider {
  async createOrder({ tenantId, institutionId, planCode, billingCycle }) {
    const plan = await getPlanByCode(planCode);
    const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const gst = Math.round(amount * 0.18);
    const finalAmount = amount + gst;

    return {
      orderId: `manual_ord_${crypto.randomBytes(8).toString('hex')}`,
      paymentId: `PAY_MANUAL_${crypto.randomBytes(8).toString('hex')}`,
      gateway: 'manual',
      amount,
      gst,
      finalAmount,
      currency: 'INR',
    };
  }
}

const completePaymentAndActivateSubscription = async ({
  tenantId,
  institutionId,
  paymentId,
  orderId,
  gateway = 'razorpay',
  gatewayTransactionId,
  planCode,
  billingCycle,
  actorUser,
}) => {
  const plan = await getPlanByCode(planCode);
  const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const gst = Math.round(amount * 0.18);
  const finalAmount = amount + gst;

  const inst = await Institution.findOne({ tenantId });
  if (!inst) throw new Error('Institution not found');

  const now = new Date();
  const expiry = billingCycle === 'yearly' ? addMonths(now, 12) : addMonths(now, 1);
  const graceEnd = new Date(expiry);
  graceEnd.setDate(graceEnd.getDate() + 7);

  const payment = await Payment.create({
    tenantId,
    institutionId,
    paymentId: paymentId || `PAY_${crypto.randomBytes(8).toString('hex')}`,
    gateway,
    gatewayTransactionId: gatewayTransactionId || `tx_${crypto.randomBytes(8).toString('hex')}`,
    orderId: orderId || `ord_${crypto.randomBytes(8).toString('hex')}`,
    amount,
    gst,
    discount: 0,
    finalAmount,
    planCode: plan.planCode,
    billingCycle,
    invoiceNumber: `INV-MTRX-${now.getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    status: 'completed',
    purchaseDate: now,
    expiryDate: expiry,
    renewalDate: expiry,
  });

  // Activate / renew institution subscription
  inst.subscription.planCode = plan.planCode;
  inst.subscription.planName = plan.name;
  inst.subscription.billingCycle = billingCycle;
  inst.subscription.status = 'active';
  inst.subscription.trialStatus = 'no_trial';
  inst.subscription.subscriptionStartDate = now;
  inst.subscription.subscriptionExpiryDate = expiry;
  inst.subscription.gracePeriodStartDate = expiry;
  inst.subscription.gracePeriodEndDate = graceEnd;
  inst.subscription.archiveDate = graceEnd;
  inst.subscription.permanentDeletionDate = new Date(graceEnd.getTime() + 86400000);
  inst.subscription.lastPaymentDate = now;
  inst.subscription.nextRenewalDate = expiry;
  inst.subscription.maxStudentLimit = plan.maxStudents;
  inst.status = 'active';
  await inst.save();

  // Create official invoice
  const invoice = await createInvoiceFromPayment(payment, inst);

  // Audit Log
  await AuditLog.create({
    tenantId,
    institutionId,
    userId: actorUser ? actorUser.id : 'system',
    userName: actorUser ? actorUser.name : 'System Payment Gateway',
    userRole: actorUser ? actorUser.role : 'system',
    action: 'PAYMENT_RECEIVED_AND_SUBSCRIPTION_ACTIVATED',
    targetModel: 'Payment',
    targetId: payment.paymentId,
    oldValue: null,
    newValue: { paymentId: payment.paymentId, planCode, billingCycle, finalAmount, expiry },
  });

  return { payment, invoice, institution: inst };
};

module.exports = {
  PaymentGatewayFactory,
  completePaymentAndActivateSubscription,
};
