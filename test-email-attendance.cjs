// Test script for sending attendance notification emails
require('dotenv').config({ path: './server/.env' });
const nodemailer = require('nodemailer');

console.log('TESTING ATTENDANCE EMAIL NOTIFICATION');
console.log('====================================');
console.log('Email credentials:');
console.log('- Service:', process.env.EMAIL_SERVICE);
console.log('- User:', process.env.EMAIL_USER);
console.log('- Password:', process.env.EMAIL_PASSWORD ? '[PROVIDED]' : '[NOT PROVIDED]');

async function testAttendanceNotification() {
  try {
    console.log('\nInitializing email transporter...');
    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true, // Enable debug logs
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    
    console.log('Verifying SMTP connection...');
    const verifyResult = await transporter.verify();
    console.log('SMTP connection verified:', verifyResult);
    
    // Test data for attendance notification
    const testData = {
      studentName: 'Test Student',
      studentId: 'STUD123',
      attendanceStatus: 'absent',
      date: new Date(),
      className: 'Grade 10-A',
      subject: 'Mathematics',
      remarks: 'This is a test attendance notification'
    };
    
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 10px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Attendance Notification</h2>
          </div>
          <div class="content">
            <p>Dear Parent,</p>
            <p>This is to inform you that <strong>${testData.studentName}</strong> (ID: ${testData.studentId}) 
            has been marked <strong>${testData.attendanceStatus}</strong> for the following class:</p>
            
            <p><strong>Date:</strong> ${testData.date.toLocaleDateString()}</p>
            <p><strong>Class:</strong> ${testData.className}</p>
            <p><strong>Subject:</strong> ${testData.subject}</p>
            <p><strong>Remarks:</strong> ${testData.remarks}</p>
            
            <p>This is a test email to verify the email notification system is working correctly.</p>
            <p>Regards,<br>School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send test email
    console.log('\nSending test attendance notification to gym666m@gmail.com...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'gym666m@gmail.com',
      subject: `Attendance Alert: ${testData.studentName} marked ${testData.attendanceStatus} in ${testData.subject}`,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testAttendanceNotification()
  .then(result => {
    console.log('\nTest completed with result:', result.success ? 'SUCCESS' : 'FAILURE');
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 