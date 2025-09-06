// server/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);

    // Decide behavior: exit or continue without DB
    if (process.env.OPTIONAL_DB === 'true') {
      console.log('⚠️ Server will continue without database connection. Some features may not work.');
    } else {
      process.exit(1); // Exit if DB is critical
    }
  }
};

module.exports = connectDB;
