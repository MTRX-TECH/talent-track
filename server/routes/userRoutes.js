const express = require('express');
const router = express.Router();
const { createUser, getUsers, getStudents, assignMentor, deleteUser, suspendUser } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { minRole } = require('../middlewares/roleMiddleware');

router.get('/', getUsers);
router.post('/create', createUser);
router.get('/students', getStudents);
router.post('/assign-mentor', assignMentor);
router.post('/delete', deleteUser);
router.delete('/:id', deleteUser);
router.post('/suspend', protect, minRole('admin'), suspendUser);

module.exports = router;
