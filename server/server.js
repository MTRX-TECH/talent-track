const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const goalRoutes = require('./routes/goalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const excelRoutes = require('./routes/excelRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Controllers for Legacy Compatibility Adapter
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const milestoneController = require('./controllers/milestoneController');
const goalController = require('./controllers/goalController');
const notifController = require('./controllers/notifController');
const statsController = require('./controllers/statsController');

const app = express();

// Connect MongoDB
connectDB();

// Security & Logging Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads and frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));

// Rate Limiter for APIs
app.use('/api/', apiLimiter);

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/upload', uploadRoutes);

// Legacy Apps Script Compatibility Route Adapter (`/exec` or `GET/POST /api`)
// Ensures 100% backward compatibility with any raw action parameter requests
const handleLegacyAction = async (req, res, next) => {
  try {
    const params = req.query || {};
    const body = req.body || {};
    const action = params.action || body.action;
    const data = Object.assign({}, params, body.data || body);
    delete data.action;

    req.body = data;
    req.query = data;

    const routes = {
      login: authController.login,
      createUser: userController.createUser,
      getUsers: userController.getUsers,
      getStudents: userController.getStudents,
      assignMentor: userController.assignMentor,
      deleteUser: userController.deleteUser,
      addMilestone: milestoneController.addMilestone,
      getMilestones: milestoneController.getMilestones,
      verifyMilestone: milestoneController.verifyMilestone,
      deleteMilestone: milestoneController.deleteMilestone,
      setGoal: goalController.setGoal,
      updateProgress: goalController.updateProgress,
      updateGoalProgress: goalController.updateGoalProgress,
      getGoals: goalController.getGoals,
      addNotification: notifController.addNotification,
      getNotifications: notifController.getNotifications,
      markAsRead: notifController.markAsRead,
      getStats: statsController.getStats,
      changePassword: authController.changePassword,
    };

    if (action && routes[action]) {
      return routes[action](req, res, next);
    }

    return res.json({ success: false, error: `Unknown legacy action: ${action || ''}` });
  } catch (err) {
    next(err);
  }
};

app.get('/exec', handleLegacyAction);
app.post('/exec', handleLegacyAction);
app.get('/api/legacy', handleLegacyAction);
app.post('/api/legacy', handleLegacyAction);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'TalentTrack Enterprise API',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`TalentTrack Enterprise Server running on port ${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api`);
  console.log(`Static Uploads: http://localhost:${PORT}/uploads`);
  console.log(`====================================================`);
});
