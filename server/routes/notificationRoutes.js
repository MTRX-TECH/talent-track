const express = require('express');
const router = express.Router();
const { addNotification, getNotifications, markAsRead } = require('../controllers/notifController');

router.get('/', getNotifications);
router.post('/add', addNotification);
router.post('/', addNotification);
router.post('/mark-read', markAsRead);

module.exports = router;
