const mongoose = require('mongoose');
const { autoSeedIfEmpty } = require('../services/seedService');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talenttrack_db';
    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    
    // Automatically seed initial accounts if the database is brand new / empty
    await autoSeedIfEmpty();
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
