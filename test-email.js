// Simple standalone script to test email functionality
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email functionality');
console.log('Email configuration:');
console.log('- SERVICE:', process.env.EMAIL_SERVICE);
console.log('- USER:', process.env.EMAIL_USER);
console.log('- PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set (hidden)' : 'Not set');

async function testEmail() {
  try {
    // Create a test transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    console.log('Testing SMTP connection...');
    const verifyResult = await transporter.verify();
    console.log('SMTP connection successful:', verifyResult);
    
    // Send a test email
    console.log('Sending test email...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'gym666m@gmail.com',  // Test recipient
      subject: 'Test Email from School System ' + new Date().toLocaleTimeString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Test Email</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p>This is a test email to verify the email service is working.</p>
            <p>Time sent: ${new Date().toString()}</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your email and password.');
    } else if (error.code === 'ESOCKET') {
      console.error('Socket error. Check your network connection.');
    }
    throw error;
  }
}

// Run the test
testEmail()
  .then(() => console.log('Test completed successfully!'))
  .catch(err => console.error('Test failed:', err.message)); 