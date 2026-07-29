/**
 * LIGHTWEIGHT SCHEMA VALIDATION MIDDLEWARE FOR TALENTTRACK ENTERPRISE
 */

const validateRules = {
  login: (body) => {
    if (!body.username || !body.password) return 'username and password are required.';
    return null;
  },

  createTenant: (body) => {
    if (!body.name) return 'Tenant name is required.';
    return null;
  },

  createCompany: (body) => {
    if (!body.name) return 'Company name is required.';
    return null;
  },

  createDrive: (body) => {
    if (!body.companyName || !body.jobRole || !body.ctc || !body.driveDate || !body.applicationDeadline) {
      return 'companyName, jobRole, ctc, driveDate, and applicationDeadline are required.';
    }
    return null;
  },

  applyDrive: (body) => {
    if (!body.driveId) return 'driveId is required.';
    return null;
  },

  issueOffer: (body) => {
    if (!body.companyName || !body.jobRole || !body.studentId || !body.ctc || !body.acceptanceDeadline) {
      return 'companyName, jobRole, studentId, ctc, and acceptanceDeadline are required.';
    }
    return null;
  },

  submitInternship: (body) => {
    if (!body.companyName || !body.role || !body.durationDays || !body.startDate || !body.endDate) {
      return 'companyName, role, durationDays, startDate, and endDate are required.';
    }
    return null;
  },

  createAssessment: (body) => {
    if (!body.title) return 'Assessment title is required.';
    return null;
  },

  aiPrompt: (body) => {
    if (!body.prompt) return 'Prompt text is required.';
    return null;
  }
};

const validate = (ruleName) => {
  return (req, res, next) => {
    const rule = validateRules[ruleName];
    if (rule) {
      const errorMsg = rule(req.body || {});
      if (errorMsg) {
        return res.status(400).json({ success: false, message: `Validation Error: ${errorMsg}` });
      }
    }
    next();
  };
};

module.exports = validate;
