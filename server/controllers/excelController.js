const User = require('../models/User');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const dataService = require('../services/dataService');
const crypto = require('crypto');

exports.previewImport = async (req, res) => {
  try {
    let rawData = [];
    
    // Check if the file was provided via middleware (like multer) or raw body
    // If not, we handle the case gracefully, but we expect a file or base64.
    // For this backend test, we'll support base64 encoded string in req.body.fileData
    if (req.body.fileData) {
      const buffer = Buffer.from(req.body.fileData, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawData = xlsx.utils.sheet_to_json(sheet);
    } else if (req.files && req.files.file) {
      const workbook = xlsx.read(req.files.file.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawData = xlsx.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ success: false, message: 'No file data uploaded.' });
    }

    const previewData = [];
    const seenEmails = new Set();
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const name = row.Name || row.name;
      const email = (row.Email || row.email || '').toString().toLowerCase().trim();
      const roleRaw = (row.Role || row.role || '').toString().toLowerCase();
      const departmentName = (row.Department || row.department || row.departmentName || '').toString().trim();
      const className = (row['Class Name'] || row.Class || row.className || '').toString().trim();

      let status = 'VALID';
      let errorMsg = [];

      if (!name) errorMsg.push('Missing name');
      if (!email || !email.includes('@')) errorMsg.push('Invalid email');
      
      const allowedRoles = ['admin', 'hod', 'mentor', 'student', 'parent'];
      if (!allowedRoles.includes(roleRaw)) {
        errorMsg.push(`Invalid role: ${roleRaw}`);
      }

      if (req.user && req.user.role === 'admin' && roleRaw !== 'hod') {
        errorMsg.push('Admin can only create HOD logins');
      }
      if (req.user && req.user.role === 'hod' && roleRaw !== 'mentor') {
        errorMsg.push('HOD can only create mentor logins');
      }
      if (req.user && req.user.role === 'mentor' && roleRaw !== 'student') {
        errorMsg.push('Mentors can only create student logins');
      }

      if (roleRaw === 'hod' && !departmentName) {
        errorMsg.push('HOD requires a department name');
      }

      if (email && seenEmails.has(email)) {
        errorMsg.push('Duplicate email in file');
      } else if (email) {
        seenEmails.add(email);
      }

      if (errorMsg.length > 0) {
        status = 'INVALID';
      }

      const record = {
        row: i + 1,
        name: name || '-',
        email: email || '-',
        role: roleRaw || '-',
        departmentName: departmentName || '-',
        className: className || '',
        status,
        errors: errorMsg.join(', ')
      };

      if (status === 'VALID') validCount++;
      else invalidCount++;

      previewData.push(record);
    }

    res.json({ success: true, preview: previewData, validCount, invalidCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process spreadsheet: ' + err.message });
  }
};

exports.executeImport = async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid user data provided for import.' });
    }

    const crypto = require('crypto');
    const tenantId = req.tenantId;
    const operations = [];
    const generatedCredentials = [];
    
    for (const u of users) {
      if (u.status !== 'VALID') continue;
      
      // Generate a secure random password for each user
      const plainPassword = crypto.randomBytes(6).toString('hex'); // 12-char random string
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(plainPassword, salt);
      
      generatedCredentials.push({ email: u.email, tempPassword: plainPassword });
      
      const cleanRole = (u.role || '').toString().toLowerCase().trim();
      const doc = {
        tenantId,
        name: u.name,
        email: u.email,
        username: u.email,
        role: cleanRole,
        departmentName: u.departmentName || '',
        className: u.className || '',
        passwordHash,
        needsPasswordChange: true,
        needsParentLogin: cleanRole === 'student',
        isActive: true
      };

      // Automatically link to the creator so the tenantScopePlugin allows them to see the created users
      if (req.user && req.user.role === 'mentor' && cleanRole === 'student') {
        doc.assignedMentorId = req.user.id;
      }
      if (req.user && req.user.role === 'hod' && cleanRole === 'mentor') {
        if (req.user.departmentId) doc.departmentId = req.user.departmentId;
        if (req.user.departmentCode) doc.departmentName = req.user.departmentCode;
      }

      const created = await dataService.create('users', doc);
      if (created) operations.push(created);
    }

    if (operations.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid records to import.' });
    }

    res.json({ 
      success: true, 
      importedCount: operations.length, 
      message: `Successfully imported ${operations.length} users.`,
      credentials: generatedCredentials // Sent exactly once to Admin for distribution
    });
  } catch (err) {
    // Handle duplicate key errors from bulkWrite gracefully
    if (err.code === 11000) {
       return res.status(400).json({ success: false, message: 'Some users already exist in the database (duplicate email).' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
