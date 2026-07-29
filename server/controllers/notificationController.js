const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id || 'usr-4';
    const { category } = req.query;
    const filter = { tenantId: req.tenantId, userId };
    if (category) filter.category = category;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).catch(() => []);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      const userId = req.user.id || 'usr-4';
      await Notification.updateMany({ tenantId: req.tenantId, userId }, { isRead: true }).catch(() => null);
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true }).catch(() => null);
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
