const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const createUser = async (req, res, next) => {
  try {
    const { name, username, password, role, domain, mentorId } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ success: false, error: 'name, username, password, role required.' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username already taken.' });
    }

    const customId = genId();
    const user = await User.create({
      customId,
      name,
      username: username.toLowerCase(),
      password,
      role: role.toLowerCase(),
      domain: domain || '',
      mentorId: mentorId || '',
    });

    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const query = req.query || {};
    const filter = {};

    if (query.role) filter.role = query.role.toLowerCase();
    
    const domainVal = query.domain || query.className || query.class;
    if (domainVal) filter.domain = domainVal;

    let users = await User.find(filter).select('-password');
    let mappedUsers = users.map(u => u.toJSON());

    if (query.mentorId) {
      const targetMentorId = String(query.mentorId).toLowerCase();
      mappedUsers = mappedUsers.filter(u => String(u.mentorId).toLowerCase() === targetMentorId);
    }

    res.json({ success: true, users: mappedUsers });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    req.query.role = 'student';
    return getUsers(req, res, next);
  } catch (error) {
    next(error);
  }
};

const assignMentor = async (req, res, next) => {
  try {
    const { studentId, mentorId } = req.body;
    if (!studentId || !mentorId) {
      return res.status(400).json({ success: false, error: 'studentId and mentorId required.' });
    }

    const student = await User.findOne({
      $or: [{ customId: studentId }, { _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }],
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    student.mentorId = mentorId;
    await student.save();

    await Notification.create({
      customId: genId(),
      userId: student.customId || student._id.toString(),
      message: 'A mentor has been assigned to you.',
      type: 'mentor',
    });

    res.json({ success: true, message: 'Mentor assigned successfully.' });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.body.id ? req.body : req.params;
    const targetId = id || req.body.id;

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'User id required.' });
    }

    const user = await User.findOneAndDelete({
      $or: [{ customId: targetId }, { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null }],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const { id, isSuspended } = req.body;
    const user = await User.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    user.isSuspended = isSuspended;
    await user.save();

    res.json({ success: true, message: `User status updated to ${isSuspended ? 'Suspended' : 'Active'}` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUsers,
  getStudents,
  assignMentor,
  deleteUser,
  suspendUser,
};
