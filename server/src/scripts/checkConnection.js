// server/src/scripts/checkConnection.js (Enhanced Atlas compatibility)
const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabaseConnection = async () => {
    try {
        console.log('🔍 Checking MongoDB connection...');
        
        const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
        const connectionType = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';
        
        console.log(`📡 Connection Type: ${connectionType}`);
        
        // Hide credentials in logs
        const logUri = process.env.MONGODB_URI.replace(
            /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
            'mongodb+srv://***:***@'
        ).replace(
            /mongodb:\/\/([^:]+):([^@]+)@/,
            'mongodb://***:***@'
        );
        console.log('🔗 Connection URI:', logUri);

        // Atlas-optimized connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: isAtlas ? 15000 : 5000, // Longer timeout for Atlas
            maxPoolSize: 10
        };

        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`✅ Successfully connected to ${connectionType}`);

        // Test database operations
        const db = mongoose.connection.db;
        
        try {
            // Get server information (works for both Atlas and local)
            const admin = db.admin();
            
            // Basic server info
            console.log('📊 Connection Information:');
            console.log(`   🏠 Host: ${mongoose.connection.host}`);
            console.log(`   📂 Database: ${mongoose.connection.name}`);
            console.log(`   🔌 Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
            
            // Try to get server status (may be limited on Atlas)
            try {
                const serverStatus = await admin.serverStatus();
                console.log(`   🔄 MongoDB Version: ${serverStatus.version}`);
                console.log(`   ⏰ Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
                if (serverStatus.connections) {
                    console.log(`   🔗 Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
                }
            } catch (statusError) {
                console.log('   ℹ️  Server status not available (normal for Atlas free tier)');
            }

            // List collections in current database
            console.log('\n📁 Database Collections:');
            const collections = await db.listCollections().toArray();
            if (collections.length === 0) {
                console.log('   📝 No collections found (normal for new database)');
            } else {
                for (const collection of collections) {
                    try {
                        const count = await db.collection(collection.name).countDocuments();
                        console.log(`   📄 ${collection.name}: ${count} documents`);
                    } catch (countError) {
                        console.log(`   📄 ${collection.name}: Count unavailable`);
                    }
                }
            }

            // Test write/read operations
            console.log('\n🧪 Testing Database Operations:');
            const testCollection = db.collection('connection_test');
            
            // Test write
            const testDoc = {
                test: true,
                timestamp: new Date(),
                connection_type: connectionType,
                test_id: Math.random().toString(36).substr(2, 9)
            };
            
            const writeResult = await testCollection.insertOne(testDoc);
            console.log('   ✅ Write test: Success');
            
            // Test read
            const readResult = await testCollection.findOne({ _id: writeResult.insertedId });
            console.log('   ✅ Read test: Success');
            
            // Test update
            await testCollection.updateOne(
                { _id: writeResult.insertedId }, 
                { $set: { updated: true, updateTime: new Date() } }
            );
            console.log('   ✅ Update test: Success');
            
            // Clean up test document
            await testCollection.deleteOne({ _id: writeResult.insertedId });
            console.log('   ✅ Delete test: Success');

        } catch (operationError) {
            console.log('⚠️  Some operations failed:', operationError.message);
        }

        console.log('\n✅ Database connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(`   Error: ${error.message}`);
        
        const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
        
        console.log('\n💡 Troubleshooting:');
        
        if (isAtlas) {
            console.log('   MongoDB Atlas Issues:');
            console.log('   1. ✓ Verify connection string username and password');
            console.log('   2. ✓ Check Atlas Network Access (IP Whitelist)');
            console.log('   3. ✓ Ensure cluster is not paused');
            console.log('   4. ✓ Verify database name in connection string');
            console.log('   5. ✓ Check Atlas cluster status');
        } else {
            console.log('   Local MongoDB Issues:');
            console.log('   1. ✓ Start MongoDB service: mongod');
            console.log('   2. ✓ Check port 27017 availability');
            console.log('   3. ✓ Verify MongoDB installation');
            console.log('   4. ✓ Check mongod process is running');
        }
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n   🔧 Connection Refused - Service not running');
        } else if (error.message.includes('authentication failed')) {
            console.log('\n   🔐 Authentication Failed - Check credentials');
        } else if (error.message.includes('timeout')) {
            console.log('\n   ⏱️  Timeout - Check network connectivity');
        }
        
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Connection closed');
        process.exit(0);
    }
};

// Run the check
checkDatabaseConnection();