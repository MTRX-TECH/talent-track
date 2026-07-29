const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const authController = require('../controllers/authController');
const tenantController = require('../controllers/tenantController');
const milestoneController = require('../controllers/milestoneController');
const analyticsController = require('../controllers/analyticsController');
const goalController = require('../controllers/goalController');
const notificationController = require('../controllers/notificationController');
const departmentController = require('../controllers/departmentController');
const excelController = require('../controllers/excelController');
const facultyController = require('../controllers/facultyController');
const studentController = require('../controllers/studentController');

// Phase 1 Controllers
const placementController = require('../controllers/placementController');
const companyController = require('../controllers/companyController');
const driveController = require('../controllers/driveController');
const recruiterController = require('../controllers/recruiterController');
const interviewController = require('../controllers/interviewController');
const offerController = require('../controllers/offerController');
const internshipController = require('../controllers/internshipController');
const aiCareerController = require('../controllers/aiCareerController');

// Phase 2 Controllers
const assessmentController = require('../controllers/assessmentController');
const certificateController = require('../controllers/certificateController');
const credentialController = require('../controllers/credentialController');
const aiAssistantController = require('../controllers/aiAssistantController');
const searchController = require('../controllers/searchController');
const parentTrackerController = require('../controllers/parentTrackerController');

const resolveTenantContext = require('../middleware/tenantContext');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/rbac');

// Health Check Endpoint
router.get('/healthcheck', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'TalentTrack Enterprise SaaS API',
    dbMode: mongoose.connection.readyState === 1 ? 'atlas' : 'memory-fallback',
    timestamp: new Date().toISOString(),
    infra: '$0.00/mo Cloudflare R2 + Render + MongoDB Atlas Free Tier'
  });
});

// Auth Routes
router.post('/auth/login', resolveTenantContext, authController.login);
router.post('/auth/refresh', resolveTenantContext, authController.refreshToken);
router.get('/auth/me', resolveTenantContext, authMiddleware, authController.getMe);
router.post('/auth/reset-password', resolveTenantContext, authMiddleware, authController.resetPassword);

// Public Tenant Onboarding Route
router.post('/public/onboard-institution/create-order', tenantController.createOrder);
router.post('/public/onboard-institution/webhook', tenantController.webhook);

// Tenant & Super Admin Routes
router.get('/superadmin/tenants', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.getAllTenants);
router.post('/superadmin/tenants', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.createTenant);
router.post('/superadmin/tenants/manual', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.manualCreateTenant);
router.delete('/superadmin/tenants/:tenantId', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.softDeleteTenant);
router.post('/superadmin/tenants/:tenantId/force-activate', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.forceActivateSettlement);
router.post('/superadmin/tenants/:tenantId/deactivate', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.deactivateTenant);
router.post('/superadmin/impersonate/:tenantId', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.impersonateTenant);
router.post('/superadmin/impersonate-exit', resolveTenantContext, authMiddleware, tenantController.exitImpersonation);
router.get('/superadmin/logs/audit', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.getAuditLogs);

router.get('/superadmin/settings', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.getSettings);
router.put('/superadmin/settings', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.updateSettings);

router.get('/superadmin/analytics/trends', resolveTenantContext, authMiddleware, checkRole(['superadmin']), tenantController.getAnalyticsTrends);


// Admin PRS Weights Routes
router.get('/admin/prs-weights', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), tenantController.getPRSWeights);
router.put('/admin/prs-weights', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), tenantController.updatePRSWeights);

// Placement Operations & Seasons Routes
router.get('/placement/seasons', resolveTenantContext, authMiddleware, placementController.getSeasons);
router.post('/placement/seasons', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), placementController.createSeason);
router.get('/placement/applications', resolveTenantContext, authMiddleware, placementController.getApplications);
router.post('/placement/apply', resolveTenantContext, authMiddleware, checkRole(['student']), placementController.applyForDrive);
router.post('/placement/check-eligibility', resolveTenantContext, authMiddleware, placementController.checkEligibility);

// Corporate Company Portal Routes
router.get('/companies', resolveTenantContext, authMiddleware, companyController.getCompanies);
router.post('/companies', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), companyController.createCompany);

// Campus Drives Routes
router.get('/drives', resolveTenantContext, authMiddleware, driveController.getDrives);
router.post('/drives', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), driveController.createDrive);

// Recruiter Portal Routes
router.get('/recruiter/drives', resolveTenantContext, authMiddleware, recruiterController.getAssignedDrives);
router.get('/recruiter/drives/:driveId/applicants', resolveTenantContext, authMiddleware, recruiterController.getDriveApplicants);
router.post('/recruiter/shortlist-feedback', resolveTenantContext, authMiddleware, recruiterController.submitShortlistFeedback);

// Interview Scheduling Routes
router.get('/interviews', resolveTenantContext, authMiddleware, interviewController.getInterviews);
router.post('/interviews/schedule', resolveTenantContext, authMiddleware, checkRole(['admin', 'mentor', 'superadmin']), interviewController.scheduleInterview);

// Offer Letter & Joining Status Routes
router.get('/offers', resolveTenantContext, authMiddleware, offerController.getOffers);
router.post('/offers/issue', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), offerController.issueOffer);
router.post('/offers/respond', resolveTenantContext, authMiddleware, checkRole(['student']), offerController.respondToOffer);

// Internship Management Routes
router.get('/internships', resolveTenantContext, authMiddleware, internshipController.getInternships);
router.post('/internships', resolveTenantContext, authMiddleware, checkRole(['student']), internshipController.submitInternship);
router.put('/internships/:id/verify', resolveTenantContext, authMiddleware, checkRole(['mentor', 'hod', 'admin', 'superadmin']), internshipController.verifyInternship);

// AI Career Intelligence & Portfolio Routes
router.get('/portfolio/:studentId?', resolveTenantContext, authMiddleware, aiCareerController.getStudentPortfolio);
router.post('/ai/scan-ats-resume', resolveTenantContext, authMiddleware, aiCareerController.scanATSResume);

// Phase 2 Routes: Institutional Assessment Engine
router.get('/assessments', resolveTenantContext, authMiddleware, assessmentController.getAssessments);
router.post('/assessments', resolveTenantContext, authMiddleware, checkRole(['admin', 'mentor', 'superadmin']), assessmentController.createAssessment);
router.post('/assessments/submit', resolveTenantContext, authMiddleware, checkRole(['student']), assessmentController.submitAttempt);

// Phase 2 Routes: Certificates & Public QR Verification
router.get('/certificates', resolveTenantContext, authMiddleware, certificateController.getCertificates);
router.get('/certificates/verify/:certId', certificateController.verifyPublicCertificate);

// Phase 2 Routes: Digital Credential Wallet
router.get('/credentials/wallet', resolveTenantContext, authMiddleware, credentialController.getStudentCredentials);

// Phase 2 Routes: AI Career Assistant
router.post('/ai/career-assistant', resolveTenantContext, authMiddleware, aiAssistantController.askCareerAssistant);

// Phase 2 Routes: Global Search
router.get('/search', resolveTenantContext, authMiddleware, searchController.globalSearch);

// Phase 2 Routes: Parent Placement Tracking & Messaging
router.get('/parent/placement-tracking', resolveTenantContext, authMiddleware, checkRole(['parent', 'admin', 'superadmin']), parentTrackerController.getParentPlacementTracking);
router.post('/parent/contact-mentor', resolveTenantContext, authMiddleware, checkRole(['parent', 'admin', 'superadmin']), parentTrackerController.contactMentor);
router.get('/parent/contact-mentor', resolveTenantContext, authMiddleware, checkRole(['parent', 'admin', 'superadmin']), parentTrackerController.getParentQueries);
router.delete('/parent/self-delete', resolveTenantContext, authMiddleware, checkRole(['parent']), parentTrackerController.selfDeleteParent);

router.get('/mentor/parent-queries', resolveTenantContext, authMiddleware, checkRole(['mentor', 'hod', 'admin', 'superadmin']), parentTrackerController.getMentorParentQueries);
router.put('/mentor/parent-queries/:id/reply', resolveTenantContext, authMiddleware, checkRole(['mentor', 'hod', 'admin', 'superadmin']), parentTrackerController.replyParentQuery);

// Department Routes
router.get('/departments', resolveTenantContext, authMiddleware, departmentController.getDepartments);
router.post('/departments', resolveTenantContext, authMiddleware, checkRole(['admin', 'superadmin']), departmentController.createDepartment);

// Milestone Routes
router.get('/milestones', resolveTenantContext, authMiddleware, milestoneController.getMilestones);
router.post('/milestones', resolveTenantContext, authMiddleware, milestoneController.createMilestone);
router.put('/milestones/:id', resolveTenantContext, authMiddleware, milestoneController.updateMilestone);
router.put('/milestones/:id/verify', resolveTenantContext, authMiddleware, checkRole(['mentor', 'hod', 'admin', 'superadmin']), milestoneController.verifyMilestone);
router.post('/milestones/bulk-verify', resolveTenantContext, authMiddleware, checkRole(['mentor', 'hod', 'admin', 'superadmin']), milestoneController.bulkVerifyMilestones);
router.post('/milestones/presigned-url', resolveTenantContext, authMiddleware, milestoneController.getPresignedUploadUrl);

// Goals Routes
router.get('/goals', resolveTenantContext, authMiddleware, goalController.getGoals);
router.post('/goals', resolveTenantContext, authMiddleware, goalController.createGoal);
router.put('/goals/:id', resolveTenantContext, authMiddleware, goalController.updateGoal);
router.delete('/goals/:id', resolveTenantContext, authMiddleware, goalController.deleteGoal);

// Notifications Routes
router.get('/notifications', resolveTenantContext, authMiddleware, notificationController.getNotifications);
router.put('/notifications/all/read', resolveTenantContext, authMiddleware, (req, res, next) => { req.params.id = 'all'; next(); }, notificationController.markAsRead);
router.put('/notifications/:id/read', resolveTenantContext, authMiddleware, notificationController.markAsRead);


// Excel Import Routes
router.post('/excel/preview-import', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'mentor', 'superadmin']), excelController.previewImport);
router.post('/excel/import', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'mentor', 'superadmin']), excelController.executeImport);

// Faculty & Student Management Routes
router.get('/faculty', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'superadmin']), facultyController.getFaculty);
router.delete('/faculty/:id', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'superadmin']), facultyController.deleteFaculty);

router.get('/students', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'mentor', 'superadmin']), studentController.getStudents);
router.get('/students/parent-status', resolveTenantContext, authMiddleware, checkRole(['student', 'admin', 'mentor', 'superadmin']), studentController.getParentStatus);
router.post('/students/setup-parent', resolveTenantContext, authMiddleware, checkRole(['student']), studentController.setupParent);
router.delete('/students/:id', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'mentor', 'superadmin']), studentController.deleteStudent);

// Assessments Routes
router.get('/assessments', resolveTenantContext, authMiddleware, assessmentController.getAssessments);
router.post('/assessments', resolveTenantContext, authMiddleware, checkRole(['admin', 'hod', 'mentor', 'superadmin']), assessmentController.createAssessment);
router.post('/assessments/attempt', resolveTenantContext, authMiddleware, checkRole(['student']), assessmentController.submitAttempt);

// Analytics & PRS Route
router.get('/analytics/prs', resolveTenantContext, authMiddleware, analyticsController.getStudentPRS);

module.exports = router;
