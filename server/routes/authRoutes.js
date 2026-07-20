const express = require('express');
const router = express.Router();
const { login, refreshTokenHandler, logout, changePassword, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);
router.post('/change-password', changePassword);
router.get('/me', protect, getMe);

module.exports = router;
