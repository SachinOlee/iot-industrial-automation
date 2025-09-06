// server/src/services/predictionService.js
const MaintenanceAlert = require('../models/MaintenanceAlert');
const SensorData = require('../models/SensorData');
const sendEmail = require('./emailService');
const User = require('../models/User');

class PredictionService {
    async analyzeAndPredict(sensorData) {
        try {
            // Basic threshold-based alerts (will be enhanced with ML later)
            const alerts = [];

            // Temperature alert
            if (sensorData.temperature > 80) {
                alerts.push({
                    alertType: 'temperature',
                    severity: sensorData.temperature > 100 ? 'critical' : 'high',
                    message: `High temperature detected: ${sensorData.temperature}°C`,
                    confidence: 0.9
                });
            }

            // Voltage alert
            if (sensorData.voltage < 200 || sensorData.voltage > 250) {
                alerts.push({
                    alertType: 'voltage',
                    severity: 'medium',
                    message: `Voltage anomaly detected: ${sensorData.voltage}V`,
                    confidence: 0.8
                });
            }

            // Motor speed alert
            if (sensorData.motorSpeed > 3000) {
                alerts.push({
                    alertType: 'vibration',
                    severity: 'high',
                    message: `High motor speed detected: ${sensorData.motorSpeed} RPM`,
                    confidence: 0.85
                });
            }

            // Create alerts in database
            for (const alertData of alerts) {
                const alert = await MaintenanceAlert.create({
                    userId: sensorData.userId,
                    machineId: sensorData.machineId,
                    ...alertData
                });

                // Send email notification for critical alerts
                if (alertData.severity === 'critical' || alertData.severity === 'high') {
                    await this.sendMaintenanceEmail(alert);
                }
            }

            // Predictive maintenance based on historical data
            await this.predictMaintenance(sensorData);

        } catch (error) {
            console.error('Prediction service error:', error);
        }
    }

    async predictMaintenance(currentData) {
        try {
            // Get historical data for the last 7 days
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            const historicalData = await SensorData.find({
                userId: currentData.userId,
                machineId: currentData.machineId,
                timestamp: { $gte: sevenDaysAgo }
            }).sort({ timestamp: -1 });

            if (historicalData.length < 10) {
                return; // Not enough data for prediction
            }

            // Simple trend analysis
            const recentData = historicalData.slice(0, 5);
            const olderData = historicalData.slice(-5);

            const recentAvgTemp = recentData.reduce((sum, data) => sum + data.temperature, 0) / recentData.length;
            const olderAvgTemp = olderData.reduce((sum, data) => sum + data.temperature, 0) / olderData.length;

            // If temperature trend is increasing significantly
            if (recentAvgTemp - olderAvgTemp > 10) {
                const predictedFailureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

                const alert = await MaintenanceAlert.create({
                    userId: currentData.userId,
                    machineId: currentData.machineId,
                    alertType: 'failure_prediction',
                    severity: 'medium',
                    message: `Increasing temperature trend detected. Maintenance recommended.`,
                    predictedFailureDate,
                    confidence: 0.7
                });

                await this.sendMaintenanceEmail(alert);
            }

        } catch (error) {
            console.error('Predictive maintenance error:', error);
        }
    }

    async sendMaintenanceEmail(alert) {
        try {
            const user = await User.findById(alert.userId);
            if (!user) return;

            const severityColors = {
                low: '#28a745',
                medium: '#ffc107',
                high: '#fd7e14',
                critical: '#dc3545'
            };

            const message = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333; text-align: center;">Maintenance Alert</h1>
                    <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h2 style="margin: 0;">Severity: ${alert.severity.toUpperCase()}</h2>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                        <p><strong>Machine ID:</strong> ${alert.machineId}</p>
                        <p><strong>Alert Type:</strong> ${alert.alertType}</p>
                        <p><strong>Message:</strong> ${alert.message}</p>
                        ${alert.predictedFailureDate ? `<p><strong>Predicted Issue Date:</strong> ${alert.predictedFailureDate.toLocaleDateString()}</p>` : ''}
                        <p><strong>Confidence:</strong> ${(alert.confidence * 100).toFixed(0)}%</p>
                        <p><strong>Time:</strong> ${alert.createdAt.toLocaleString()}</p>
                    </div>
                    <p style="margin-top: 20px;">Please log in to your dashboard to view more details and take appropriate action.</p>
                </div>
            `;

            await sendEmail({
                to: user.email,
                subject: `${alert.severity.toUpperCase()} Maintenance Alert - ${alert.machineId}`,
                html: message
            });

            // Mark email as sent
            alert.emailSent = true;
            alert.emailSentAt = new Date();
            await alert.save();

        } catch (error) {
            console.error('Send maintenance email error:', error);
        }
    }
}

module.exports = new PredictionService();