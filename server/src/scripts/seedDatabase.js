// server/src/scripts/seedDatabase.js (Enhanced with Atlas compatibility)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const SensorData = require('../models/SensorData');
const MaintenanceAlert = require('../models/MaintenanceAlert');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Connect to database with Atlas-optimized settings
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10
        };

        await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        
        const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
        console.log(`🔗 Connected to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);

        // Optional: Clear existing data (COMMENTED OUT FOR SAFETY)
        // console.log('🧹 Clearing existing data...');
        // await User.deleteMany({});
        // await SensorData.deleteMany({});
        // await MaintenanceAlert.deleteMany({});

        // Create admin user
        const adminExists = await User.findOne({ email: 'admin@iot.com' });
        if (!adminExists) {
            const adminUser = new User({
                firstName: 'System',
                lastName: 'Administrator',
                email: 'admin@iot.com',
                password: 'Admin@123456', // Will be hashed by the model
                role: 'admin',
                isEmailVerified: true,
                isActive: true
            });
            await adminUser.save();
            console.log('✅ Admin user created: admin@iot.com / Admin@123456');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Create test user
        const testUserExists = await User.findOne({ email: 'user@iot.com' });
        if (!testUserExists) {
            const testUser = new User({
                firstName: 'Test',
                lastName: 'User',
                email: 'user@iot.com',
                password: 'User@123456',
                role: 'user',
                isEmailVerified: true,
                isActive: true
            });
            await testUser.save();
            console.log('✅ Test user created: user@iot.com / User@123456');
        } else {
            console.log('ℹ️  Test user already exists');
        }

        // Get user for sample data
        const sampleUser = await User.findOne({ email: 'user@iot.com' });

        // Create sample sensor data
        const sensorDataCount = await SensorData.countDocuments({ userId: sampleUser._id });
        if (sensorDataCount === 0) {
            console.log('📊 Creating sample sensor data...');
            const sampleSensorData = [];
            const machines = ['MACHINE-001', 'MACHINE-002', 'MACHINE-003', 'MACHINE-004', 'MACHINE-005'];

            // Create varied historical data
            for (let i = 0; i < 100; i++) {
                const machineId = machines[Math.floor(Math.random() * machines.length)];
                const baseTime = new Date();
                baseTime.setHours(baseTime.getHours() - i * 0.5); // Every 30 minutes

                // Generate realistic sensor values with some variation
                const isAnomaly = Math.random() < 0.05; // 5% chance of anomaly
                
                sampleSensorData.push({
                    userId: sampleUser._id,
                    machineId: machineId,
                    motorSpeed: isAnomaly 
                        ? Math.floor(Math.random() * 500) + 2500  // Anomaly: 2500-3000 RPM
                        : Math.floor(Math.random() * 300) + 1800, // Normal: 1800-2100 RPM
                    voltage: isAnomaly 
                        ? Math.floor(Math.random() * 30) + 270   // Anomaly: 270-300V
                        : Math.floor(Math.random() * 20) + 220,  // Normal: 220-240V
                    temperature: isAnomaly 
                        ? Math.floor(Math.random() * 20) + 90    // Anomaly: 90-110°C
                        : Math.floor(Math.random() * 25) + 65,   // Normal: 65-90°C
                    heat: isAnomaly 
                        ? Math.floor(Math.random() * 30) + 140   // Anomaly: 140-170
                        : Math.floor(Math.random() * 40) + 90,   // Normal: 90-130
                    workingStatus: !isAnomaly && Math.random() > 0.1, // 90% uptime when normal
                    workingPeriod: Math.floor(Math.random() * 12) + 4, // 4-16 hours
                    timestamp: baseTime
                });
            }

            // Insert in batches for better Atlas performance
            const batchSize = 50;
            for (let i = 0; i < sampleSensorData.length; i += batchSize) {
                const batch = sampleSensorData.slice(i, i + batchSize);
                await SensorData.insertMany(batch);
            }
            
            console.log(`✅ Created ${sampleSensorData.length} sample sensor data points`);
        } else {
            console.log(`ℹ️  Sensor data already exists (${sensorDataCount} records)`);
        }

        // Create sample alerts
        const alertCount = await MaintenanceAlert.countDocuments({ userId: sampleUser._id });
        if (alertCount === 0) {
            console.log('🚨 Creating sample maintenance alerts...');
            const sampleAlerts = [
                {
                    userId: sampleUser._id,
                    machineId: 'MACHINE-001',
                    alertType: 'temperature',
                    severity: 'high',
                    message: 'High temperature detected: 95°C - Immediate attention required',
                    confidence: 0.92,
                    isResolved: false,
                    createdAt: new Date()
                },
                {
                    userId: sampleUser._id,
                    machineId: 'MACHINE-002',
                    alertType: 'vibration',
                    severity: 'medium',
                    message: 'Unusual vibration pattern detected - Schedule inspection',
                    confidence: 0.78,
                    isResolved: true,
                    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                },
                {
                    userId: sampleUser._id,
                    machineId: 'MACHINE-003',
                    alertType: 'motor_speed',
                    severity: 'low',
                    message: 'Motor speed fluctuation detected - Monitor closely',
                    confidence: 0.65,
                    isResolved: false,
                    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
                },
                {
                    userId: sampleUser._id,
                    machineId: 'MACHINE-004',
                    alertType: 'voltage',
                    severity: 'high',
                    message: 'Voltage spike detected: 285V - Power system check required',
                    confidence: 0.88,
                    isResolved: false,
                    createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
                }
            ];

            await MaintenanceAlert.insertMany(sampleAlerts);
            console.log(`✅ Created ${sampleAlerts.length} sample maintenance alerts`);
        } else {
            console.log(`ℹ️  Maintenance alerts already exist (${alertCount} records)`);
        }

        console.log('🎉 Database seeding completed successfully!');
        
        // Display comprehensive summary
        const userCount = await User.countDocuments();
        const sensorCount = await SensorData.countDocuments();
        const totalAlertCount = await MaintenanceAlert.countDocuments();
        const activeAlerts = await MaintenanceAlert.countDocuments({ isResolved: false });

        console.log('\n📊 Database Summary:');
        console.log(`   👥 Users: ${userCount}`);
        console.log(`   📈 Sensor Data Points: ${sensorCount}`);
        console.log(`   🚨 Total Alerts: ${totalAlertCount}`);
        console.log(`   ⚠️  Active Alerts: ${activeAlerts}`);
        console.log(`   ✅ Resolved Alerts: ${totalAlertCount - activeAlerts}`);

        console.log('\n🔑 Login Credentials:');
        console.log('   👨‍💼 Admin: admin@iot.com / Admin@123456');
        console.log('   👤 User:  user@iot.com / User@123456');

        console.log(`\n🌐 Database Type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        console.log('\n💡 Common Issues:');
        console.log('   - Check your MongoDB connection');
        console.log('   - Verify your .env file configuration');
        console.log('   - Ensure your models are properly defined');
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Database connection closed');
    }
};

// Run seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;