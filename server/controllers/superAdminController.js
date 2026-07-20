const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const getSystemAnalytics = async (req, res, next) => {
  try {
    const [userCounts, milestoneCount, goalCount, deptCount, activityCount] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Milestone.countDocuments(),
      Goal.countDocuments(),
      Department.countDocuments(),
      ActivityLog.countDocuments(),
    ]);

    const roleStats = {};
    userCounts.forEach(item => {
      roleStats[item._id] = item.count;
    });

    res.json({
      success: true,
      analytics: {
        usersByRole: roleStats,
        totalMilestones: milestoneCount,
        totalGoals: goalCount,
        totalDepartments: deptCount,
        totalActivitiesLogged: activityCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs: logs.map(l => l.toJSON()) });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs: logs.map(l => l.toJSON()) });
  } catch (error) {
    next(error);
  }
};

const backupDatabase = async (req, res, next) => {
  try {
    const [users, milestones, goals, departments, notifications, activityLogs] = await Promise.all([
      User.find().select('-password'),
      Milestone.find(),
      Goal.find(),
      Department.find(),
      Notification.find(),
      ActivityLog.find(),
    ]);

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      collections: {
        users,
        milestones,
        goals,
        departments,
        notifications,
        activityLogs,
      },
    };

    res.header('Content-Type', 'application/json');
    res.attachment(`talenttrack_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    next(error);
  }
};

const restoreDatabase = async (req, res, next) => {
  try {
    const { backup } = req.body;
    if (!backup || !backup.collections) {
      return res.status(400).json({ success: false, error: 'Invalid backup structure' });
    }

    const { users, milestones, goals, departments } = backup.collections;

    if (users && users.length) {
      await User.deleteMany({ role: { $ne: 'superadmin' } });
      for (const u of users) {
        if (u.role !== 'superadmin') {
          await User.create({
            customId: u.customId || genId(),
            name: u.name,
            username: u.username,
            password: u.password || 'password123',
            role: u.role,
            domain: u.domain || '',
            mentorId: u.mentorId || '',
          });
        }
      }
    }

    if (milestones && milestones.length) {
      await Milestone.deleteMany({});
      await Milestone.insertMany(milestones);
    }

    if (goals && goals.length) {
      await Goal.deleteMany({});
      await Goal.insertMany(goals);
    }

    if (departments && departments.length) {
      await Department.deleteMany({});
      await Department.insertMany(departments);
    }

    res.json({ success: true, message: 'Database restored successfully.' });
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, error: 'Setting key required' });

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { key, value, updatedBy: req.user.username },
      { upsert: true, new: true }
    );

    res.json({ success: true, setting });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemAnalytics,
  getActivityLogs,
  getAuditLogs,
  backupDatabase,
  restoreDatabase,
  getSettings,
  updateSetting,
};
