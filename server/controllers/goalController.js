const Goal = require('../models/Goal');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const setGoal = async (req, res, next) => {
  try {
    const { studentId, target, achieved, unit, dueDate } = req.body;

    if (!studentId || target === undefined || target === '') {
      return res.status(400).json({ success: false, error: 'studentId and target required.' });
    }

    const goal = await Goal.create({
      customId: genId(),
      studentId,
      target: Number(target) || 0,
      achieved: Number(achieved) || 0,
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

    if (!id) {
      return res.status(400).json({ success: false, error: 'Goal id required.' });
    }

    const goal = await Goal.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found.' });
    }

    goal.achieved = Number(achieved) || 0;
    await goal.save();

    res.json({ success: true, goal: goal.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const query = req.query || {};
    let filter = {};

    if (query.studentId) {
      filter.studentId = query.studentId;
    }

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
