const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, deleteDepartment, getCourses, createCourse } = require('../controllers/departmentController');

router.get('/', getDepartments);
router.post('/create', createDepartment);
router.delete('/:id', deleteDepartment);
router.get('/courses', getCourses);
router.post('/courses/create', createCourse);

module.exports = router;
