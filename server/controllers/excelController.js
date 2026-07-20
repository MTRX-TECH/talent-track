const XLSX = require('xlsx');
const { Parser } = require('json2csv');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const parseUploadedFile = (file) => {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};

const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    const type = req.body.type || 'students'; // students, mentors, milestones, goals, departments
    const rows = parseUploadedFile(req.file);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Uploaded file is empty' });
    }

    const existingUsers = await User.find().select('username customId');
    const existingUsernames = new Set(existingUsers.map(u => u.username.toLowerCase()));

    const validRows = [];
    const errorRows = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      const errors = [];

      if (type === 'students' || type === 'mentors' || type === 'users') {
        const name = row.Name || row.name;
        const username = String(row.Username || row.username || '').trim().toLowerCase();
        const password = row.Password || row.password || 'password123';
        const domain = row.Domain || row.domain || row.Class || row.class || '';

        if (!name) errors.push('Name missing');
        if (!username) errors.push('Username missing');
        if (existingUsernames.has(username)) errors.push(`Username '${username}' already exists`);

        if (errors.length === 0) {
          validRows.push({ rowNum, name, username, password, role: type === 'mentors' ? 'mentor' : 'student', domain });
        } else {
          errorRows.push({ rowNum, rowData: row, errors: errors.join(', ') });
        }
      } else if (type === 'milestones') {
        const studentId = row.StudentId || row.studentId;
        const title = row.Title || row.title;
        const category = row.Category || row.category || 'General';
        const description = row.Description || row.description || '';

        if (!studentId) errors.push('StudentId missing');
        if (!title) errors.push('Title missing');

        if (errors.length === 0) {
          validRows.push({ rowNum, studentId, title, category, description, date: row.Date || new Date().toISOString().split('T')[0] });
        } else {
          errorRows.push({ rowNum, rowData: row, errors: errors.join(', ') });
        }
      } else if (type === 'departments') {
        const code = String(row.Code || row.code || '').trim().toUpperCase();
        const name = row.Name || row.name;

        if (!code) errors.push('Code missing');
        if (!name) errors.push('Name missing');

        if (errors.length === 0) {
          validRows.push({ rowNum, code, name, description: row.Description || '' });
        } else {
          errorRows.push({ rowNum, rowData: row, errors: errors.join(', ') });
        }
      }
    });

    res.json({
      success: true,
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errorRows.length,
      preview: validRows.slice(0, 10),
      errors: errorRows,
      validRows,
    });
  } catch (error) {
    next(error);
  }
};

const executeImport = async (req, res, next) => {
  try {
    const { type, rows } = req.body; // valid rows passed from preview step

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid rows provided for import' });
    }

    const inserted = [];

    if (type === 'students' || type === 'mentors' || type === 'users') {
      for (const item of rows) {
        const customId = genId();
        const u = await User.create({
          customId,
          name: item.name,
          username: item.username,
          password: item.password || 'password123',
          role: item.role || (type === 'mentors' ? 'mentor' : 'student'),
          domain: item.domain || '',
        });
        inserted.push(u.toJSON());
      }
    } else if (type === 'milestones') {
      for (const item of rows) {
        const m = await Milestone.create({
          customId: genId(),
          studentId: item.studentId,
          title: item.title,
          category: item.category || 'General',
          description: item.description || '',
          date: item.date || new Date().toISOString().split('T')[0],
          verified: 'false',
        });
        inserted.push(m.toJSON());
      }
    } else if (type === 'departments') {
      for (const item of rows) {
        const d = await Department.create({
          code: item.code.toUpperCase(),
          name: item.name,
          description: item.description || '',
        });
        inserted.push(d.toJSON());
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${inserted.length} records.`,
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
};

const exportData = async (req, res, next) => {
  try {
    const { entity } = req.params; // students, mentors, departments, milestones, goals, notifications
    const format = (req.query.format || 'xlsx').toLowerCase();

    let data = [];
    let filename = `${entity}_export_${Date.now()}`;

    if (entity === 'students') {
      const users = await User.find({ role: 'student' }).select('-password');
      data = users.map(u => ({
        ID: u.customId || u._id.toString(),
        Name: u.name,
        Username: u.username,
        Domain: u.domain,
        MentorID: u.mentorId || 'None',
        CreatedAt: u.createdAt.toISOString(),
      }));
    } else if (entity === 'mentors') {
      const users = await User.find({ role: 'mentor' }).select('-password');
      data = users.map(u => ({
        ID: u.customId || u._id.toString(),
        Name: u.name,
        Username: u.username,
        Domain: u.domain,
        CreatedAt: u.createdAt.toISOString(),
      }));
    } else if (entity === 'milestones') {
      const milestones = await Milestone.find();
      data = milestones.map(m => ({
        ID: m.customId || m._id.toString(),
        StudentID: m.studentId,
        StudentName: m.studentName,
        Title: m.title,
        Category: m.category,
        Verified: m.verified,
        Feedback: m.mentorFeedback,
        Date: m.date,
      }));
    } else if (entity === 'goals') {
      const goals = await Goal.find();
      data = goals.map(g => ({
        ID: g.customId || g._id.toString(),
        StudentID: g.studentId,
        Target: g.target,
        Achieved: g.achieved,
        Unit: g.unit,
        DueDate: g.dueDate,
      }));
    } else if (entity === 'departments') {
      const depts = await Department.find();
      data = depts.map(d => ({
        Code: d.code,
        Name: d.name,
        HodID: d.hodId || 'None',
        Description: d.description,
      }));
    }

    if (data.length === 0) {
      data = [{ Message: 'No records found in database' }];
    }

    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${filename}.csv`);
      return res.send(csv);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, entity);

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`${filename}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { previewImport, executeImport, exportData };
