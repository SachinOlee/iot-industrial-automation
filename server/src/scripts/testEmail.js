// server/src/scripts/testEmail.js
require('dotenv').config();
const sendEmail = require('../services/emailService');

const testEmailService = async () => {
    try {
        console.log('🧪 Testing Email Service Configuration...\n');

        // Check environment variables
        console.log('📋 Email Configuration:');
        console.log(`   Host: ${process.env.EMAIL_HOST || process.env.SMTP_HOST}`);
        console.log(`   Port: ${process.env.EMAIL_PORT || process.env.SMTP_PORT}`);
        console.log(`   User: ${process.env.EMAIL_USER || process.env.SMTP_EMAIL}`);
        console.log(`   From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
        console.log(`   Password: ${process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'}\n`);

        // Test email sending
        const testMessage = `
            <h1>Email Service Test</h1>
            <p>This is a test email from your IoT Industrial Automation system.</p>
            <p>If you received this email, your email configuration is working correctly!</p>
            <p>Time: ${new Date().toLocaleString()}</p>
        `;

        console.log('📤 Sending test email...');
        await sendEmail({
            to: process.env.EMAIL_USER || process.env.SMTP_EMAIL,
            subject: 'Email Service Test - IoT Industrial Automation',
            html: testMessage
        });

        console.log('✅ Test email sent successfully!');
        console.log('📬 Check your inbox for the test email.');

    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Verify your email credentials in .env file');
        console.log('2. For Gmail: Use App Password instead of regular password');
        console.log('3. Check if your email provider blocks SMTP');
        console.log('4. Verify firewall/antivirus settings');
        process.exit(1);
    }
};

// Run test if called directly
if (require.main === module) {
    testEmailService();
}

module.exports = testEmailService;