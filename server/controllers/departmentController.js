const Department = require('../models/Department');
const Course = require('../models/Course');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ code: 1 });
    res.json({ success: true, departments: departments.map(d => d.toJSON()) });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { code, name, hodId, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Department code and name required.' });
    }

    const dept = await Department.create({
      code: code.toUpperCase(),
      name,
      hodId: hodId || '',
      description: description || '',
    });

    res.json({ success: true, department: dept.toJSON() });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ code: 1 });
    res.json({ success: true, courses: courses.map(c => c.toJSON()) });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { code, title, departmentCode, year } = req.body;
    if (!code || !title) {
      return res.status(400).json({ success: false, error: 'Course code and title required.' });
    }

    const course = await Course.create({
      code: code.toUpperCase(),
      title,
      departmentCode: departmentCode ? departmentCode.toUpperCase() : '',
      year: year || 1,
    });

    res.json({ success: true, course: course.toJSON() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment,
  getCourses,
  createCourse,
};
