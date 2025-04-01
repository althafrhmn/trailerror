// Test script for sending attendance notification emails
require('dotenv').config({ path: './server/.env' });
const nodemailer = require('nodemailer');
const { sendAttendanceNotification } = require('./server/services/emailService');

console.log('TESTING ATTENDANCE EMAIL NOTIFICATION');
console.log('====================================');
console.log('Email credentials:');
console.log('- Service:', process.env.EMAIL_SERVICE);
console.log('- User:', process.env.EMAIL_USER);
console.log('- Password:', process.env.EMAIL_PASSWORD ? '[PROVIDED]' : '[NOT PROVIDED]');

async function testAttendanceNotification() {
  try {
    console.log('\nSending test attendance notification...');
    
    // Test data for attendance notification
    const testData = {
      studentName: 'Test Student',
      studentId: 'STUD123',
      studentEmail: 'gym666m@gmail.com', // Send to the test email
      parentEmail: 'gym666m@gmail.com', // Send to the test email
      parentName: 'Test Parent',
      attendanceStatus: 'absent',
      date: new Date(),
      className: 'Grade 10-A',
      subject: 'Mathematics',
      remarks: 'This is a test attendance notification'
    };
    
    // Send the notification
    const result = await sendAttendanceNotification(testData);
    
    console.log('\nEmail sending results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS: Attendance notification emails were sent successfully!');
    } else {
      console.log('\n❌ FAILURE: Some or all attendance notification emails failed to send.');
    }
    
    return result;
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testAttendanceNotification()
  .then(result => {
    console.log('\nTest completed.');
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 