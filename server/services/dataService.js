/**
 * TALENTTRACK ENTERPRISE — UNIFIED DATA ADAPTER SERVICE
 * Strictly connects to MongoDB Atlas / active database instances.
 * Local memory fallback and local saving have been entirely removed per institutional security policy.
 */

const mongoose = require('mongoose');

// Collection Name to Mongoose Model Mapping
const models = {
  users: require('../models/User'),
  tenants: require('../models/Tenant'),
  departments: require('../models/Department'),
  milestones: require('../models/Milestone'),
  goals: require('../models/Goal'),
  notifications: require('../models/Notification'),
  auditLogs: require('../models/AuditLog'),
  placementSeasons: require('../models/PlacementSeason'),
  companies: require('../models/Company'),
  recruiterProfiles: require('../models/RecruiterProfile'),
  placementDrives: require('../models/PlacementDrive'),
  placementApplications: require('../models/PlacementApplication'),
  interviews: require('../models/InterviewSchedule'),
  offers: require('../models/OfferLetter'),
  internships: require('../models/Internship'),
  portfolio: require('../models/Portfolio'),
  resumeVersions: require('../models/ResumeVersion'),
  assessments: require('../models/Assessment'),
  assessmentAttempts: require('../models/AssessmentAttempt'),
  questions: require('../models/Question'),
  certificates: require('../models/Certificate'),
  badges: require('../models/DigitalBadge'),
  careerChats: require('../models/CareerChat'),
  parentAlerts: require('../models/ParentAlert'),
  parentQueries: require('../models/ParentQuery'),
  platformSettings: require('../models/PlatformSettings')
};

function isAtlasConnected() {
  return mongoose.connection.readyState === 1;
}

function ensureActiveDatabase() {
  if (!isAtlasConnected()) {
    throw new Error('Database connection is currently inactive. Local memory saving is disabled; data cannot be saved or accessed locally.');
  }
}

const dataService = {
  isAtlasConnected,

  async find(collectionName, filter = {}, tenantId = null) {
    ensureActiveDatabase();
    const finalFilter = tenantId ? { tenantId, ...filter } : filter;
    if (!models[collectionName]) {
      throw new Error(`Model for collection '${collectionName}' does not exist.`);
    }
    return await models[collectionName].find(finalFilter);
  },

  async findOne(collectionName, filter = {}, tenantId = null) {
    ensureActiveDatabase();
    const finalFilter = tenantId ? { tenantId, ...filter } : filter;
    if (!models[collectionName]) {
      throw new Error(`Model for collection '${collectionName}' does not exist.`);
    }
    return await models[collectionName].findOne(finalFilter);
  },

  async create(collectionName, itemData) {
    ensureActiveDatabase();
    if (!models[collectionName]) {
      throw new Error(`Model for collection '${collectionName}' does not exist.`);
    }
    const doc = new models[collectionName](itemData);
    return await doc.save();
  },

  async updateOne(collectionName, filter = {}, updateData = {}, tenantId = null) {
    ensureActiveDatabase();
    const finalFilter = tenantId ? { tenantId, ...filter } : filter;
    if (!models[collectionName]) {
      throw new Error(`Model for collection '${collectionName}' does not exist.`);
    }
    return await models[collectionName].findOneAndUpdate(finalFilter, updateData, { new: true });
  },

  async deleteOne(collectionName, filter = {}, tenantId = null) {
    ensureActiveDatabase();
    const finalFilter = tenantId ? { tenantId, ...filter } : filter;
    if (!models[collectionName]) {
      throw new Error(`Model for collection '${collectionName}' does not exist.`);
    }
    return await models[collectionName].findOneAndDelete(finalFilter);
  },

  async deleteMany(collectionName, filter = {}, tenantId = null) {
    ensureActiveDatabase();
    const finalFilter = tenantId ? { tenantId, ...filter } : filter;
    if (!models[collectionName]) {
      throw new Error(`Model for collection '${collectionName}' does not exist.`);
    }
    return await models[collectionName].deleteMany(finalFilter);
  }
};

module.exports = dataService;
