const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const {
  getSystemAnalytics,
  getActivityLogs,
  getAuditLogs,
  backupDatabase,
  restoreDatabase,
  getSettings,
  updateSetting,
} = require('../controllers/superAdminController');

router.use(protect, authorize('superadmin'));

router.get('/analytics', getSystemAnalytics);
router.get('/activity-logs', getActivityLogs);
router.get('/audit-logs', getAuditLogs);
router.get('/backup', backupDatabase);
router.post('/restore', restoreDatabase);
router.get('/settings', getSettings);
router.post('/settings', updateSetting);

module.exports = router;
