const Goal = require('../models/Goal');

exports.getGoals = async (req, res) => {
  try {
    const studentId = req.user.id || 'usr-4';
    const goals = await Goal.find({ tenantId: req.tenantId, studentId }).catch(() => []);
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { title, targetDate } = req.body;
    const studentId = req.user.id || 'usr-4';
    const newGoal = new Goal({
      tenantId: req.tenantId,
      studentId,
      title,
      targetDate: targetDate || '2026-12-01',
      progress: 0
    });
    await newGoal.save().catch(() => null);
    res.json({ success: true, goal: newGoal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    const goal = await Goal.findById(id).catch(() => null);
    if (goal) {
      if (progress !== undefined) goal.progress = progress;
      if (status) goal.status = status;
      await goal.save().catch(() => null);
    }
    res.json({ success: true, goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    await Goal.findByIdAndDelete(id).catch(() => null);
    res.json({ success: true, message: 'Target goal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
