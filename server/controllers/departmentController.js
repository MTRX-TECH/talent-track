const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ tenantId: req.tenantId }).catch(() => []);
    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    const newDept = new Department({
      tenantId: req.tenantId,
      name,
      code
    });
    await newDept.save().catch(() => null);
    res.json({ success: true, department: newDept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
