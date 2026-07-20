const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talenttrack_db';
    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    // Do not call process.exit(1) on production/Render so the server stays up and serves diagnostic messages instead of 502 Bad Gateway
    if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
