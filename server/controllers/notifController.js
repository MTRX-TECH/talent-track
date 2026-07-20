const Notification = require('../models/Notification');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const addNotification = async (req, res, next) => {
  try {
    const { userId, message, type } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId and message required.' });
    }

    const notification = await Notification.create({
      customId: genId(),
      userId,
      message,
      read: 'false',
      type: type || 'info',
    });

    res.json({ success: true, notification: notification.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const { userId, unreadOnly } = req.query || {};

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required.' });
    }

    const filter = { userId };
    if (String(unreadOnly) === 'true') {
      filter.read = 'false';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications: notifications.map(n => n.toJSON()) });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id, userId } = req.body;

    if (id) {
      await Notification.updateOne(
        { $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { read: 'true' }
      );
    } else if (userId) {
      await Notification.updateMany(
        { userId, read: 'false' },
        { read: 'true' }
      );
    }

    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addNotification,
  getNotifications,
  markAsRead,
};
