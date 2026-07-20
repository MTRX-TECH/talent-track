const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const superAdminController = require('../controllers/superAdminController');

router.use(authMiddleware);
router.use(roleMiddleware(['superadmin']));

router.get('/analytics', superAdminController.getBillingAnalytics);
router.get('/plans', superAdminController.getSubscriptionPlansMaster);
router.put('/plans/:id', superAdminController.updateSubscriptionPlanMaster);
router.get('/audit-logs', superAdminController.getAuditLogs);
router.get('/backup', superAdminController.backupDatabase);

module.exports = router;
