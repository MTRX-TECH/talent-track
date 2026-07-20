const Goal = require('../models/Goal');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const setGoal = async (req, res, next) => {
  try {
    const { studentId, target, unit, dueDate } = req.body;
    if (!studentId || !target) {
      return res.status(400).json({ success: false, error: 'studentId and target required.' });
    }

    const tenantId = req.tenantId || (req.user ? req.user.tenantId : 'TNT_GLOBAL');
    const institutionId = req.institutionId || (req.user ? req.user.institutionId : 'INST_GLOBAL');

    const customId = genId();
    const goal = await Goal.create({
      tenantId,
      institutionId,
      customId,
      studentId,
      target: Number(target),
      achieved: 0,
      unit: unit || 'milestones',
      dueDate: dueDate || '',
    });

    res.json({ success: true, goal: goal.toJSON() });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const { id, achieved } = req.body;
    if (!id || achieved === undefined) {
      return res.status(400).json({ success: false, error: 'id and achieved count required.' });
    }

    const filter = {
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    };
    if (req.user && req.user.role !== 'superadmin') {
      filter.tenantId = req.tenantId;
    }

    const goal = await Goal.findOne(filter);
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found.' });
    }

    goal.achieved = Number(achieved);
    await goal.save();

    res.json({ success: true, goal: goal.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const filter = {};

    if (req.user && req.user.role !== 'superadmin') {
      filter.tenantId = req.tenantId || req.user.tenantId;
    }

    if (studentId) filter.studentId = studentId;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, goals: goals.map(g => g.toJSON()) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setGoal,
  updateProgress,
  updateGoalProgress: updateProgress,
  getGoals,
};
