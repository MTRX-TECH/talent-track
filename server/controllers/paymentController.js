const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Institution = require('../models/Institution');
const { PaymentGatewayFactory, completePaymentAndActivateSubscription } = require('../services/paymentProvider');

const createCheckoutOrder = async (req, res, next) => {
  try {
    const { planCode, billingCycle = 'monthly', gateway = 'razorpay' } = req.body;
    const tenantId = req.tenantId || req.user.tenantId;
    const institutionId = req.institutionId || req.user.institutionId;

    if (!planCode) {
      return res.status(400).json({ success: false, error: 'planCode is required' });
    }

    const provider = PaymentGatewayFactory.getProvider(gateway);
    const orderData = await provider.createOrder({ tenantId, institutionId, planCode, billingCycle });

    res.json({
      success: true,
      order: orderData,
      planCode,
      billingCycle,
    });
  } catch (err) {
    next(err);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, orderId, gatewayTransactionId, gateway = 'razorpay', planCode, billingCycle = 'monthly' } = req.body;
    const tenantId = req.tenantId || req.user.tenantId;
    const institutionId = req.institutionId || req.user.institutionId;

    const result = await completePaymentAndActivateSubscription({
      tenantId,
      institutionId,
      paymentId,
      orderId,
      gateway,
      gatewayTransactionId,
      planCode,
      billingCycle,
      actorUser: req.user,
    });

    res.json({
      success: true,
      message: `Subscription successfully activated on ${planCode.toUpperCase()} plan.`,
      payment: result.payment,
      invoice: result.invoice,
    });
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'];
    const payload = req.body;
    const gateway = req.query.gateway || 'razorpay';

    const provider = PaymentGatewayFactory.getProvider(gateway);
    const isValid = await provider.verifyWebhook(signature, payload);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const tenantId = payload.tenantId || payload.notes?.tenantId;
    const institutionId = payload.institutionId || payload.notes?.institutionId;
    const planCode = payload.planCode || payload.notes?.planCode || 'standard';
    const billingCycle = payload.billingCycle || payload.notes?.billingCycle || 'monthly';

    if (tenantId) {
      await completePaymentAndActivateSubscription({
        tenantId,
        institutionId,
        paymentId: payload.payment_id || payload.id,
        orderId: payload.order_id,
        gateway,
        gatewayTransactionId: payload.payment_id || payload.id,
        planCode,
        billingCycle,
      });
    }

    res.json({ success: true, received: true });
  } catch (err) {
    next(err);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const filter = req.user.role === 'superadmin' ? {} : { tenantId: req.tenantId };
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
      invoices,
    });
  } catch (err) {
    next(err);
  }
};

const getInvoiceDetails = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;
    const filter = { invoiceNumber };
    if (req.user.role !== 'superadmin') {
      filter.tenantId = req.tenantId;
    }

    const invoice = await Invoice.findOne(filter);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCheckoutOrder,
  confirmPayment,
  handleWebhook,
  getPaymentHistory,
  getInvoiceDetails,
};
