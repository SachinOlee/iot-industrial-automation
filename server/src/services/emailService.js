// server/src/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
        port: process.env.EMAIL_PORT || process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || process.env.SMTP_EMAIL,
            pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
        },
        // For Gmail, you might need to enable "Less secure app access" or use App Passwords
        // For other providers, check their SMTP settings
    });

    return transporter;
};

// Send email function
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        // Verify connection configuration
        await transporter.verify();

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'IoT Industrial Automation'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || '', // Fallback text version
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        return info;

    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error(`Email could not be sent: ${error.message}`);
    }
};

// Test email configuration
const testEmailConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email service is ready to send emails');
        return true;
    } catch (error) {
        console.error('❌ Email service configuration error:', error.message);
        return false;
    }
};

module.exports = sendEmail;
module.exports.testEmailConnection = testEmailConnection;