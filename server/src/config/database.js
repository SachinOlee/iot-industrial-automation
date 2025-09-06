// server/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        console.log('Server will continue without database connection. Some features may not work.');
        // Don't exit the process, let the server start
    }
};

module.exports = connectDB;