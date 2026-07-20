const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const addMilestone = async (req, res, next) => {
  try {
    const { studentId, studentName, title, category, description, imageUrl, date } = req.body;

    if (!title || !studentId) {
      return res.status(400).json({ success: false, error: 'Title and studentId are required.' });
    }

    const tenantId = req.tenantId || (req.user ? req.user.tenantId : 'TNT_GLOBAL');
    const institutionId = req.institutionId || (req.user ? req.user.institutionId : 'INST_GLOBAL');

    const customId = genId();
    const milestone = await Milestone.create({
      tenantId,
      institutionId,
      customId,
      studentId,
      studentName: studentName || (req.user ? req.user.name : 'Student'),
      title,
      category: category || 'General',
      description: description || '',
      imageUrl: imageUrl || '',
      date: date || new Date().toISOString().split('T')[0],
      verified: 'pending',
    });

    res.json({ success: true, milestone: milestone.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getMilestones = async (req, res, next) => {
  try {
    const { studentId, category, verified } = req.query;
    const filter = {};

    if (req.user && req.user.role !== 'superadmin') {
      filter.tenantId = req.tenantId || req.user.tenantId;
    }

    if (studentId) filter.studentId = studentId;
    if (category && category !== 'all') filter.category = category;
    if (verified) filter.verified = verified;

    const milestones = await Milestone.find(filter).sort({ createdAt: -1 });
    const mapped = milestones.map(m => m.toJSON());

    res.json({ success: true, milestones: mapped });
  } catch (error) {
    next(error);
  }
};

const verifyMilestone = async (req, res, next) => {
  try {
    const { id, verified, mentorFeedback } = req.body;
    if (!id || verified === undefined) {
      return res.status(400).json({ success: false, error: 'id and verified status required.' });
    }

    const filter = {
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    };
    if (req.user && req.user.role !== 'superadmin') {
      filter.tenantId = req.tenantId;
    }

    const milestone = await Milestone.findOne(filter);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    milestone.verified = String(verified);
    if (mentorFeedback !== undefined) milestone.mentorFeedback = mentorFeedback;
    await milestone.save();

    await Notification.create({
      tenantId: milestone.tenantId,
      institutionId: milestone.institutionId,
      userId: milestone.studentId,
      message: `Your milestone "${milestone.title}" was ${String(verified) === 'true' ? 'Verified' : 'marked for revision'}.`,
      type: 'verification',
    });

    res.json({ success: true, milestone: milestone.toJSON() });
  } catch (error) {
    next(error);
  }
};

const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.body.id ? req.body : req.params;
    const targetId = id || req.body.id;

    const filter = {
      $or: [{ customId: targetId }, { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null }],
    };
    if (req.user && req.user.role !== 'superadmin') {
      filter.tenantId = req.tenantId;
    }

    const milestone = await Milestone.findOneAndDelete(filter);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    res.json({ success: true, message: 'Milestone deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMilestone,
  getMilestones,
  verifyMilestone,
  deleteMilestone,
};
