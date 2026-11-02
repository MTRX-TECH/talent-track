/**
 * TALENTTRACK ENTERPRISE — RESILIENT SELF-HEALING DATABASE ADAPTER
 * Developed by MTRX TECH — Founder & CEO: Marapathran V
 *
 * Capabilities:
 * 1. Single-Flight Mutex Connection (Prevents concurrent thrashing & disconnect loops)
 * 2. Multi-tier URI Candidate Fallback (Primary -> Fallback -> 127.0.0.1 -> localhost)
 * 3. Graceful Polling Awaiter (waitForConnection: ensures requests pause and succeed instead of 503)
 * 4. Windows Service Healthcheck & Auto-Start Safeguard
 * 5. Event-driven recovery without interrupting active connecting loops
 */

const mongoose = require('mongoose');
const { execSync } = require('child_process');

let isConnecting = false;
let connectPromise = null;
let reconnectTimer = null;
let currentConnectedUri = null;
let listenersAttached = false;

function sanitizeMongoUri(uri) {
  if (!uri) return 'unknown';
  return uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
}

function getCandidateUris() {
  const uris = [];
  const addUri = (u) => {
    if (u && typeof u === 'string') {
      const trimmed = u.trim();
      if (trimmed && !uris.includes(trimmed)) {
        uris.push(trimmed);
      }
    }
  };

  addUri(process.env.MONGODB_URI);
  addUri(process.env.MONGODB_URI_FALLBACK);
  addUri('mongodb://127.0.0.1:27017/talenttrack');
  addUri('mongodb://localhost:27017/talenttrack');

  return uris;
}

function checkAndStartWindowsMongoService() {
  if (process.platform === 'win32') {
    try {
      const status = execSync('sc.exe query MongoDB 2>&1', { timeout: 2000 }).toString();
      if (status.includes('STOPPED')) {
        console.log('[DB] Detected stopped MongoDB Windows service. Attempting to start...');
        execSync('net start MongoDB 2>&1', { timeout: 5000 });
        console.log('[DB] MongoDB Windows service started successfully.');
      }
    } catch (_) {
      // Non-fatal: user might be running MongoDB via Docker or standalone binary
    }
  }
}

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log(`[DB] ✅ MongoDB Connection Active [${sanitizeMongoUri(currentConnectedUri)}]`);
  });

  mongoose.connection.on('disconnected', () => {
    // Only schedule auto-reconnect if we are not actively in the middle of connectDB()
    if (!isConnecting) {
      console.warn('[DB] ⚠️ MongoDB Connection Dropped. Triggering auto-reconnect cycle...');
      currentConnectedUri = null;

      if (!reconnectTimer) {
        reconnectTimer = setTimeout(async () => {
          reconnectTimer = null;
          try {
            await connectDB({ timeout: 4000 });
          } catch (e) {
            console.error('[DB] Background auto-reconnect failed. Will retry on next request:', e.message);
          }
        }, 2000);
      }
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] ❌ MongoDB Connection Error:', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] 🔄 MongoDB Reconnected Successfully.');
  });
}

async function connectDB(options = {}) {
  // 1. If already fully connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. If a connection attempt is currently in-flight, return the shared promise
  if (isConnecting && connectPromise) {
    return await connectPromise;
  }

  attachConnectionListeners();

  isConnecting = true;
  connectPromise = (async () => {
    const candidateUris = getCandidateUris();
    let lastError = null;

    for (const uri of candidateUris) {
      if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
        checkAndStartWindowsMongoService();
      }

      try {
        console.log(`[DB] Attempting connection to: ${sanitizeMongoUri(uri)}...`);
        
        // Only disconnect if currently connected or connecting to a different instance
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
          await mongoose.disconnect().catch(() => {});
        }

        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: options.timeout || 4000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 1,
          heartbeatFrequencyMS: 10000,
          connectTimeoutMS: 5000
        });

        currentConnectedUri = uri;
        isConnecting = false;
        connectPromise = null;

        console.log('=======================================================');
        console.log('🚀 TALENTTRACK ENTERPRISE DATABASE ACTIVE');
        console.log(`🌐 Connected: ${sanitizeMongoUri(uri)}`);
        console.log('=======================================================');

        return conn;
      } catch (err) {
        lastError = err;
        console.warn(`[DB] Connection to ${sanitizeMongoUri(uri)} failed: ${err.message}`);
      }
    }

    isConnecting = false;
    connectPromise = null;
    currentConnectedUri = null;
    console.error('❌ All MongoDB connection candidates failed. Last error:', lastError?.message);
    throw lastError || new Error('All MongoDB connection candidates failed.');
  })();

  return await connectPromise;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Robust waiter that pauses the request until DB connection is established.
 * Prevents returning 503 during normal initialization or brief reconnects.
 */
async function waitForConnection(timeoutMs = 6000) {
  if (mongoose.connection.readyState === 1) return true;

  // Trigger connect if not already connecting
  connectDB().catch(() => {});

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return mongoose.connection.readyState === 1;
}

function getConnectionStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    isConnected: mongoose.connection.readyState === 1,
    uri: sanitizeMongoUri(currentConnectedUri)
  };
}

module.exports = {
  connectDB,
  isConnected,
  waitForConnection,
  getConnectionStatus,
  sanitizeMongoUri
};
