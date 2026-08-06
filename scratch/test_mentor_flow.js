require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');
const excelController = require('../server/controllers/excelController');
const studentController = require('../server/controllers/studentController');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Get a mentor user
  const mentor = await User.findOne({ role: 'mentor' });
  if (!mentor) throw new Error("No mentor found");

  const reqUser = { id: mentor._id.toString(), role: 'mentor', tenantId: mentor.tenantId };
  
  // 2. Simulate manual creation
  let responseData = null;
  let statusCode = null;
  const mockRes = {
    status: (code) => { statusCode = code; return mockRes; },
    json: (data) => { responseData = data; return mockRes; },
  };

  const manualForm = { name: 'Test Delete', email: 'testdel@student.com', role: 'student', status: 'VALID' };
  const mockReqImport = {
    user: reqUser,
    body: { users: [manualForm] }
  };

  await excelController.executeImport(mockReqImport, mockRes);
  console.log("Import response:", statusCode, responseData);

  // 3. Find the created student
  const student = await User.findOne({ email: 'testdel@student.com' });
  if (!student) throw new Error("Student not created");
  console.log("Student created:", student._id, "Role:", student.role);

  // 4. Test getting students (to see if _id is undefined in the frontend)
  let studentsData = null;
  const mockResGet = {
    json: (data) => { studentsData = data; }
  };
  const mockReqGet = {
    tenantId: mentor.tenantId,
    user: reqUser
  };
  await studentController.getStudents(mockReqGet, mockResGet);
  const createdStudent = studentsData.students.find(s => s.email === 'testdel@student.com');
  console.log("Student from getStudents:", JSON.stringify(createdStudent, null, 2));

  // 5. Simulate deletion
  let deleteData = null;
  let deleteStatus = null;
  const mockResDelete = {
    status: (code) => { deleteStatus = code; return mockResDelete; },
    json: (data) => { deleteData = data; return mockResDelete; },
  };
  const mockReqDelete = {
    user: reqUser,
    tenantId: mentor.tenantId,
    params: { id: student._id.toString() }
  };

  await studentController.deleteStudent(mockReqDelete, mockResDelete);
  console.log("Delete response:", deleteStatus, deleteData);

  await User.deleteOne({ email: 'testdel@student.com' }); // Cleanup
  process.exit(0);
}

test().catch(console.error);
