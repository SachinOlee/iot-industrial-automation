// server/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MongoDB connection options (optimized for both local and Atlas)
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        };

        console.log('🔗 Connecting to MongoDB...');

        // Detect Atlas vs Local
        const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
        const connectionType = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';

        // Hide credentials in logs
        const logUri = process.env.MONGODB_URI.replace(
            /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
            'mongodb+srv://***:***@'
        ).replace(
            /mongodb:\/\/([^:]+):([^@]+)@/,
            'mongodb://***:***@'
        );

        console.log(`📡 Connection Type: ${connectionType}`);
        console.log(`🔗 Connection URI: ${logUri}`);

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ ${connectionType} Connected Successfully!`);
        console.log(`🏠 Host: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔌 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

        // Handle events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔴 MongoDB connection closed through app termination');
            process.exit(0);
        });

        return conn;

    } catch (error) {
        console.error('❌ Database connection error:', error.message);

        // Decide behavior based on OPTIONAL_DB flag
        if (process.env.OPTIONAL_DB === 'true') {
            console.log('⚠️ Server will continue without database connection. Some features may not work.');
            return null;
        }

        // Troubleshooting tips
        const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
        console.log('\n💡 Troubleshooting tips:');
        if (isAtlas) {
            console.log('   1. Verify your connection string credentials');
            console.log('   2. Check Atlas cluster status and availability');
            console.log('   3. Ensure your IP address is whitelisted in Atlas');
            console.log('   4. Verify network/firewall settings');
            console.log('   5. Check if your Atlas cluster is paused');
        } else {
            console.log('   1. Make sure MongoDB is running: mongod');
            console.log('   2. Check if MongoDB is listening on port 27017');
            console.log('   3. Verify the connection URI in your .env file');
            console.log('   4. Windows: Check MongoDB service');
            console.log('   5. Mac: brew services start mongodb-community');
        }

        process.exit(1);
    }
};

// Enhanced connection testing
const testConnection = async () => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        if (!isConnected) {
            console.log('⚠️  Database not connected');
            return false;
        }

        console.log('🔍 Testing database operations...');
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('📝 Available collections:', collections.map(c => c.name) || ['None yet']);

            const testDoc = await mongoose.connection.db.collection('connection_test').insertOne({
                test: true,
                timestamp: new Date(),
                connection_type: process.env.MONGODB_URI.includes('mongodb+srv://') ? 'Atlas' : 'Local'
            });

            if (testDoc.insertedId) {
                console.log('✅ Write operation successful');
                await mongoose.connection.db.collection('connection_test').deleteOne({ _id: testDoc.insertedId });
            }

            return true;
        } catch (testError) {
            console.error('❌ Database operations test failed:', testError.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    }
};

module.exports = { connectDB, testConnection };
