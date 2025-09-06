const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // SensorData indexes
    await db.collection('sensordatas').createIndex({ machineId: 1, timestamp: -1 });
    await db.collection('sensordatas').createIndex({ userId: 1, timestamp: -1 });
    
    // Alert indexes
    await db.collection('alerts').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('alerts').createIndex({ machineId: 1, isResolved: 1 });
    
    console.log('Indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();