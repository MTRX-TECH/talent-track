const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Webhook endpoint (unprotected for gateway POST calls)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authMiddleware);

router.post('/create-order', paymentController.createCheckoutOrder);
router.post('/confirm', paymentController.confirmPayment);
router.get('/history', paymentController.getPaymentHistory);
router.get('/invoice/:invoiceNumber', paymentController.getInvoiceDetails);

module.exports = router;
