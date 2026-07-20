const express = require('express');
const router = express.Router();
const { addMilestone, getMilestones, verifyMilestone, deleteMilestone } = require('../controllers/milestoneController');

router.get('/', getMilestones);
router.post('/add', addMilestone);
router.post('/', addMilestone);
router.post('/verify', verifyMilestone);
router.post('/delete', deleteMilestone);
router.delete('/:id', deleteMilestone);

module.exports = router;
