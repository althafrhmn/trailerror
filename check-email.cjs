// Basic email test script
const nodemailer = require('nodemailer');

console.log('SCRIPT STARTED');

// Use updated email credentials
const EMAIL_USER = 'iamnaseemshan@gmail.com';
const EMAIL_PASSWORD = 'ndmu oroj ncee wfqw';

console.log('=== Email Test Script ===');
console.log('Email user:', EMAIL_USER);
console.log('Email password:', EMAIL_PASSWORD ? 'Provided' : 'Not provided');

async function testEmail() {
  console.log('Test function called');
  
  // Create transporter with hardcoded credentials for testing
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    },
    debug: true, // Enable debug logs
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
  
  console.log('Transporter created');
  
  try {
    console.log('Verifying SMTP connection...');
    const verifyResult = await transporter.verify();
    console.log('SMTP connection verified:', verifyResult);
    
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: EMAIL_USER,
      to: 'gym666m@gmail.com',
      subject: 'Test Email ' + new Date().toISOString(),
      text: 'This is a test email sent at ' + new Date().toString(),
      html: `<p>This is a <b>test email</b> sent at ${new Date().toString()}</p>`
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    return { success: true, result };
  } catch (error) {
    console.error('Email test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    console.error('Stack trace:', error.stack);
    
    return { success: false, error };
  }
}

console.log('About to run test');

// Execute the test
testEmail().then(result => {
  console.log('Test completed with result:', result.success ? 'SUCCESS' : 'FAILURE');
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Unexpected error in test function:', err);
  process.exit(1);
}); 