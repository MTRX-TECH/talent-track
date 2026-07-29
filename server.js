/**
 * TALENTTRACK ENTERPRISE — MERN STACK EXPRESS API GATEWAY & SPA SERVER
 * Developed by MTRX TECH — Founder & CEO: Marapathran V
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./server/routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware Stack
app.use(helmet({
  contentSecurityPolicy: false
}));

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

// Serverless Connection Caching Pattern
let cachedMongoose = global.mongoose;
if (!cachedMongoose) {
  cachedMongoose = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not found. Database connection inactive; local memory storage is disabled.');
    return null;
  }

  if (cachedMongoose.conn) {
    return cachedMongoose.conn;
  }

  if (!cachedMongoose.promise) {
    console.log('Connecting to MongoDB Atlas...');
    cachedMongoose.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    }).then((m) => {
      console.log('=======================================================');
      console.log('🚀 TALENTTRACK ENTERPRISE MERN STACK ACTIVE');
      console.log('⚡ Developed by MTRX TECH — Founder & CEO: Marapathran V');
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log('=======================================================');
      console.log('✅ MongoDB Atlas Connection Established Successfully.');
      console.log('=======================================================');
      return m;
    }).catch((err) => {
      console.error('❌ MongoDB Atlas Connection Timeout / Offline:', err.message || err);
      console.error('⚠️ Database connection is inactive. Local memory saving option has been disabled per security policy; data operations will return explicit error messages.');
      cachedMongoose.promise = null;
      cachedMongoose.conn = null;
      return null;
    });
  }

  cachedMongoose.conn = await cachedMongoose.promise;
  return cachedMongoose.conn;
}

connectDB();

// API Gateway Subsystem with Auto-Reconnect Mechanism
app.use('/api', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
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
