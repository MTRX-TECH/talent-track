const express = require('express');
const router = express.Router();
const { setGoal, updateProgress, updateGoalProgress, getGoals } = require('../controllers/goalController');

router.get('/', getGoals);
router.post('/set', setGoal);
router.post('/', setGoal);
router.post('/update-progress', updateProgress);
router.post('/update-goal-progress', updateGoalProgress);

module.exports = router;
