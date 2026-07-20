const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

router.use(authMiddleware);

router.get('/plans', subscriptionController.getSubscriptionPlans);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/grant-free-premium', roleMiddleware(['superadmin']), subscriptionController.handleGrantFreePremium);
router.post('/revoke-free-premium', roleMiddleware(['superadmin']), subscriptionController.handleRevokeFreePremium);

module.exports = router;
