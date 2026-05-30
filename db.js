const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/project-iq-ai';
    console.log(`🔌 Connecting to MongoDB: ${connStr}...`);
    
    // Set connection timeout to 4 seconds to fail fast and trigger offline mock fallback
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 4000
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed: ${error.message}`);
    console.warn(`ℹ️  Running in high-performance "Offline Mock DB" mode. Operations will proceed in-memory.`);
    return false;
  }
};

module.exports = connectDB;
