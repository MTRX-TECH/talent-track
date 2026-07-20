const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const addMilestone = async (req, res, next) => {
  try {
    const { studentId, title, description, category, date, imageUrl } = req.body;

    if (!studentId || !title) {
      return res.status(400).json({ success: false, error: 'studentId and title required.' });
    }

    const student = await User.findOne({
      $or: [{ customId: studentId }, { _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }],
    });

    const milestoneCustomId = genId();
    const milestone = await Milestone.create({
      customId: milestoneCustomId,
      studentId,
      studentName: req.body.studentName || (student ? student.name : ''),
      title,
      description: description || '',
      category: category || 'General',
      date: date || new Date().toISOString().split('T')[0],
      imageUrl: imageUrl || '',
      verified: 'false',
      mentorFeedback: '',
    });

    if (student && student.mentorId) {
      const mentor = await User.findOne({
        $or: [{ customId: student.mentorId }, { _id: student.mentorId.match(/^[0-9a-fA-F]{24}$/) ? student.mentorId : null }],
      });
      if (mentor) {
        await Notification.create({
          customId: genId(),
          userId: mentor.customId || mentor._id.toString(),
          message: `${milestone.studentName} added a new milestone: "${milestone.title}"`,
          type: 'milestone',
        });
      }
    }

    res.json({ success: true, milestone: milestone.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getMilestones = async (req, res, next) => {
  try {
    const query = req.query || {};
    let filter = {};

    if (query.studentId) {
      filter.studentId = query.studentId;
    }

    if (query.verified !== undefined && query.verified !== '') {
      filter.verified = String(query.verified);
    }

    if (query.category && query.category !== 'all') {
      filter.category = query.category;
    }

    let milestones = await Milestone.find(filter).sort({ createdAt: -1 });
    let mapped = milestones.map(m => m.toJSON());

    // Mentor / Class filter filtering
    const className = query.className || query.class;
    if (className || query.mentorId) {
      const userFilter = { role: 'student' };
      if (className) userFilter.domain = className;
      if (query.mentorId) userFilter.mentorId = query.mentorId;

      const matchedStudents = await User.find(userFilter);
      const studentIds = matchedStudents.map(s => s.customId || s._id.toString());
      mapped = mapped.filter(m => studentIds.includes(m.studentId));
    }

    if (query.limit) {
      mapped = mapped.slice(0, Number(query.limit));
    }

    res.json({ success: true, milestones: mapped });
  } catch (error) {
    next(error);
  }
};

const verifyMilestone = async (req, res, next) => {
  try {
    const { id, verified, mentorFeedback } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Milestone id required.' });
    }

    const milestone = await Milestone.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    milestone.verified = String(verified);
    if (mentorFeedback !== undefined) {
      milestone.mentorFeedback = mentorFeedback;
    }
    await milestone.save();

    const isApproved = String(verified) === 'true';
    await Notification.create({
      customId: genId(),
      userId: milestone.studentId,
      message: isApproved
        ? `Your milestone "${milestone.title}" was verified.`
        : `Your milestone "${milestone.title}" needs revision. Feedback: ${milestone.mentorFeedback || 'None'}`,
      type: 'verification',
    });

    res.json({
      success: true,
      message: 'Milestone updated.',
      milestone: milestone.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.body.id ? req.body : req.params;
    const targetId = id || req.body.id;

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Milestone id required.' });
    }

    const milestone = await Milestone.findOneAndDelete({
      $or: [{ customId: targetId }, { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null }],
    });

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
