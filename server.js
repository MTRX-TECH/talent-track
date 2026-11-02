/**
 * TALENTTRACK ENTERPRISE — MERN STACK EXPRESS API GATEWAY & SPA SERVER
 * Developed by MTRX TECH — Founder & CEO: Marapathran V
 */

require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const db = require('./server/db');
const apiRoutes = require('./server/routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust first proxy (essential for rate limiting behind PM2/NGINX)

// Security & Middleware Stack
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// 1. Global Rate Limiting (Prevents DDoS / Scraping)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(globalLimiter);

// 2. HTTP Header Security
app.use(helmet()); // Uses strict defaults including CSP

// 3. Prevent NoSQL Injection
app.use(mongoSanitize());

// 4. Prevent XSS (Cross-Site Scripting)
app.use(xss());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize resilient database connection (multi-candidate fallback + self-healing)
db.connectDB().catch((err) => {
  console.warn('[DATABASE BOOT WARNING] Initial connection deferred. Background recovery active:', err.message);
});

// API Gateway Subsystem with Auto-Reconnect & Health Check Mechanism
app.use('/api', async (req, res, next) => {
  if (!db.isConnected()) {
    await db.waitForConnection(6000);
  }

  if (!db.isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is temporarily inactive. Please retry in a few moments.'
    });
  }
  next();
}, apiRoutes);

// Serve React Static Assets (MERN Stack Build)
const reactDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(reactDistPath));
app.use(express.static(__dirname));

// React SPA Route Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint not found.' });
  }
  const indexPath = path.join(reactDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send(`
        <div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center;">
          <h2>⚠️ Frontend Build Missing</h2>
          <p>The React SPA could not be found at <code>client/dist/index.html</code>.</p>
          <p>If you are deploying this application, ensure your build script runs:<br/><br/>
          <code>npm install --prefix client && npm run build --prefix client</code></p>
        </div>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Express Gateway Listening on http://localhost:${PORT}`);
});

module.exports = app;
