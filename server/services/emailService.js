// Load environment variables first
require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');

// Create a transporter using SMTP with proper error handling
let transporter;
try {
  // Log email configuration for debugging
  console.log('Setting up email transporter with config:', {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD ? '[MASKED]' : 'NOT SET'
  });
  
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    debug: true, // Enable debug logs for development
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });

  // Verify transporter connection on initialization
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service verification failed:', error);
    } else {
      console.log('Email service is ready to send messages');
    }
  });
} catch (error) {
  console.error('Failed to initialize email transporter:', error);
}

const sendLeaveApplication = async (leaveData) => {
  console.log('==================================================');
  console.log('📧 LEAVE APPLICATION EMAIL PROCESS STARTED');
  console.log('==================================================');
  
  try {
    if (!transporter) {
      console.error('❌ ERROR: Email transporter not initialized');
      console.error('❌ Cannot send leave application email - email service not configured');
      return { sent: false, error: 'Email service not configured properly' };
    }
    
    console.log('Attempting to send leave application email with data:', {
      subject: leaveData.subject,
      toEmail: leaveData.toEmail,
      fromDate: new Date(leaveData.fromDate).toLocaleDateString(),
      toDate: new Date(leaveData.toDate).toLocaleDateString(),
      studentName: leaveData.studentName
    });

    const {
      subject,
      toEmail,
      fromDate,
      toDate,
      leaveType,
      content,
      attachments,
      studentName,
      studentId
    } = leaveData;

    // Validate required fields
    if (!toEmail) {
      console.error('❌ ERROR: Missing required email recipient');
      console.error('❌ Cannot send leave application email without recipient address');
      return { sent: false, error: 'Email recipient is required' };
    }

    // Format dates
    const formattedFromDate = new Date(fromDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedToDate = new Date(toDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calculate leave duration in days
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get leave type color
    const getLeaveTypeColor = (type) => {
      const colors = {
        'Medical': '#E53935',
        'Personal': '#1E88E5',
        'Family': '#43A047',
        'Exam': '#FFA000',
        'Event': '#8E24AA',
        'Test': '#00ACC1',
        'Other': '#607D8B'
      };
      return colors[type] || '#607D8B';
    };
    
    const leaveTypeColor = getLeaveTypeColor(leaveType);
    
    // Current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create email content with improved design
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Leave Application: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Leave Application</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #1976d2;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .date-sent {
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              margin-top: 5px;
            }
            .content {
              background-color: white;
              padding: 25px;
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .student-info {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              display: inline-block;
              width: 100px;
            }
            .leave-type-badge {
              display: inline-block;
              background-color: ${leaveTypeColor};
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
            }
            .duration-box {
              background-color: #f5f5f5;
              border-left: 4px solid #1976d2;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .date-range {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
            }
            .date-box {
              text-align: center;
              flex: 1;
            }
            .date-box.start {
              border-right: 1px dashed #ccc;
            }
            .date-label {
              font-size: 12px;
              color: #777;
              margin-bottom: 5px;
            }
            .date-value {
              font-weight: bold;
              color: #333;
            }
            .content-box {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 4px;
              margin-top: 20px;
              white-space: pre-wrap;
              border-left: 4px solid #ddd;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #777;
              text-align: center;
              padding-top: 15px;
              border-top: 1px solid #eee;
            }
            .days-count {
              text-align: center;
              margin-top: 10px;
              font-weight: bold;
              color: #1976d2;
            }
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100%;
                padding: 10px;
              }
              .header, .content {
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Leave Application</h1>
              <div class="date-sent">Submitted on ${currentDate}</div>
            </div>
            
            <div class="content">
              <div class="student-info">
                <p><span class="info-label">From:</span> ${studentName}</p>
                <p><span class="info-label">Student ID:</span> ${studentId}</p>
                <p><span class="info-label">Leave Type:</span> <span class="leave-type-badge">${leaveType}</span></p>
                <p><span class="info-label">Subject:</span> ${subject}</p>
              </div>
              
              <div class="duration-box">
                <div class="date-range">
                  <div class="date-box start">
                    <div class="date-label">FROM</div>
                    <div class="date-value">${formattedFromDate}</div>
                  </div>
                  <div class="date-box">
                    <div class="date-label">TO</div>
                    <div class="date-value">${formattedToDate}</div>
                  </div>
                </div>
                <div class="days-count">
                  Duration: ${durationDays} day${durationDays > 1 ? 's' : ''}
                </div>
              </div>
              
              <h3>Reason for Leave:</h3>
              <div class="content-box">
                ${content}
              </div>
              
              <div class="footer">
                <p>This is an automated message from the School Management System.</p>
                <p>Please review this leave application and take appropriate action.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: attachments && attachments.length ? attachments.map((file, index) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
      })) : []
    };

    // Log email attempt
    console.log('📤 Sending leave application email to:', toEmail);
    console.log(`   Student: ${studentName} (${studentId})`);
    console.log(`   Leave period: ${formattedFromDate} to ${formattedToDate} (${durationDays} days)`);
    console.log(`   Leave type: ${leaveType}`);
    console.log(`   Attachments: ${(attachments && attachments.length) ? attachments.length : 'None'}`);
    
    // Verify transporter is working
    try {
      console.log('✓ Verifying SMTP connection before sending email...');
      await transporter.verify();
      console.log('✓ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      console.error('❌ Cannot send leave application email due to SMTP connection failure');
      return { sent: false, error: 'Failed to connect to email server: ' + verifyError.message };
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ SUCCESS: Leave application email sent successfully');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipient: ${toEmail}`);
    
    console.log('==================================================');
    console.log('📧 LEAVE APPLICATION EMAIL SUMMARY:');
    console.log(`Student: ${studentName} (${studentId})`);
    console.log(`Leave: ${leaveType} from ${formattedFromDate} to ${formattedToDate}`);
    console.log('✅ OVERALL STATUS: Email sent successfully');
    console.log('==================================================');
    
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('==================================================');
    console.error('❌ ERROR sending leave application email:');
    console.error(`Error code: ${error.code || 'N/A'}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error response: ${error.response || 'No response data'}`);
    console.error(`Stack trace: ${error.stack}`);
    console.error('==================================================');
    
    return { sent: false, error: 'Failed to send leave application email: ' + error.message };
  }
};

/**
 * Send attendance notification email to parent and student when student is marked absent or late
 * @param {Object} attendanceData - Data related to student attendance
 * @returns {Object} Success status and message IDs for parent and student emails
 */
const sendAttendanceNotification = async (attendanceData) => {
  console.log('==================================================');
  console.log('📧 ATTENDANCE EMAIL NOTIFICATION PROCESS STARTED');
  console.log('==================================================');
  
  try {
    const {
      studentName,
      studentId,
      studentEmail,
      parentEmail,
      parentName,
      attendanceStatus,
      date,
      className,
      subject,
      remarks
    } = attendanceData;

    console.log(`Processing attendance notification for student: ${studentName} (${studentId})`);
    console.log(`Attendance status: ${attendanceStatus}, Class: ${className}, Subject: ${subject}`);
    console.log(`Parent email: ${parentEmail || 'Not provided'}, Student email: ${studentEmail || 'Not provided'}`);

    // Check for required data
    if (!parentEmail && !studentEmail) {
      console.error('❌ ERROR: No recipient email provided for attendance notification');
      console.error('❌ Cannot proceed with email notification without at least one recipient');
      return { success: false, error: 'No recipient email provided' };
    }

    // Format the date
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create status-specific content
    const statusColor = attendanceStatus === 'absent' ? '#dc3545' : '#ffc107';
    const statusText = attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1);
    
    // Create email results object to track both emails
    const result = {
      success: true,
      parent: { sent: false },
      student: { sent: false }
    };

    // Common HTML content for both emails
    const createEmailHTML = (recipientType, recipientName) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendance Notification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #1976d2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .status-badge {
            display: inline-block;
            background-color: ${statusColor};
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
          }
          .info-box {
            background-color: #f5f5f5;
            border-left: 4px solid #1976d2;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
            padding-top: 15px;
            border-top: 1px solid #eee;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100%;
              padding: 10px;
            }
            .header, .content {
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Attendance Notification</h1>
          </div>
          
          <div class="content">
            ${recipientType === 'parent' 
              ? `<p>Dear ${recipientName || 'Parent'},</p>
                <p>This is to inform you that your child, <strong>${studentName}</strong> (ID: ${studentId}), has been marked 
                <span class="status-badge">${statusText}</span> 
                for the following class:</p>`
              : `<p>Dear ${studentName},</p>
                <p>This is to inform you that you have been marked 
                <span class="status-badge">${statusText}</span> 
                for the following class:</p>`
            }
            
            <div class="info-box">
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Class:</strong> ${className}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
            </div>
            
            ${recipientType === 'parent'
              ? `<p>Please note that regular attendance is crucial for academic progress. If you have any concerns or need to provide additional information regarding this absence, please contact the class teacher or school administration.</p>`
              : `<p>If you believe this is an error or if you have a valid reason for your ${statusText.toLowerCase()} status, please discuss this with your faculty or submit a leave application as appropriate.</p>`
            }
            
            <p>Thank you for your attention to this matter.</p>
            
            <p style="margin-top: 20px;">Regards,<br/>School Administration</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the School Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Verify SMTP connection before sending emails
    try {
      console.log('✓ Verifying SMTP connection before sending emails...');
      await transporter.verify();
      console.log('✓ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP connection verification failed:', verifyError.message);
      console.error('❌ Cannot send emails due to SMTP connection failure');
      return { 
        success: false, 
        error: 'Failed to connect to email server: ' + verifyError.message 
      };
    }

    // Send email to parent if email is provided
    if (parentEmail) {
      try {
        console.log(`📤 Attempting to send notification email to parent (${parentEmail})`);
        
        const parentMailOptions = {
          from: process.env.EMAIL_USER,
          to: parentEmail,
          subject: `Attendance Alert: ${studentName} marked ${statusText} in ${subject}`,
          html: createEmailHTML('parent', parentName)
        };

        // Send parent email
        const parentInfo = await transporter.sendMail(parentMailOptions);
        console.log(`✅ SUCCESS: Notification email sent to parent (${parentEmail})`);
        console.log(`   Message ID: ${parentInfo.messageId}`);
        result.parent = { sent: true, messageId: parentInfo.messageId };
      } catch (parentError) {
        console.error(`❌ ERROR: Failed to send email to parent (${parentEmail})`);
        console.error(`   Error code: ${parentError.code || 'N/A'}`);
        console.error(`   Error message: ${parentError.message}`);
        if (parentError.response) console.error(`   Server response: ${parentError.response}`);
        
        result.parent = { sent: false, error: parentError.message };
        result.success = false;
      }
    } else {
      console.log('ℹ️ No parent email provided, skipping parent notification');
    }

    // Send email to student if email is provided
    if (studentEmail) {
      try {
        console.log(`📤 Attempting to send notification email to student (${studentEmail})`);
        
        const studentMailOptions = {
          from: process.env.EMAIL_USER,
          to: studentEmail,
          subject: `Attendance Alert: You were marked ${statusText} in ${subject}`,
          html: createEmailHTML('student', studentName)
        };

        // Send student email
        const studentInfo = await transporter.sendMail(studentMailOptions);
        console.log(`✅ SUCCESS: Notification email sent to student (${studentEmail})`);
        console.log(`   Message ID: ${studentInfo.messageId}`);
        result.student = { sent: true, messageId: studentInfo.messageId };
      } catch (studentError) {
        console.error(`❌ ERROR: Failed to send email to student (${studentEmail})`);
        console.error(`   Error code: ${studentError.code || 'N/A'}`);
        console.error(`   Error message: ${studentError.message}`);
        if (studentError.response) console.error(`   Server response: ${studentError.response}`);
        
        result.student = { sent: false, error: studentError.message };
        result.success = result.parent.sent; // Overall success is true if at least one email was sent
      }
    } else {
      console.log('ℹ️ No student email provided, skipping student notification');
    }

    // Summarize the results
    console.log('==================================================');
    console.log('📧 EMAIL NOTIFICATION SUMMARY:');
    console.log(`Student: ${studentName} (${studentId})`);
    console.log(`Attendance: ${statusText} in ${subject} on ${formattedDate}`);
    
    if (result.parent.sent || result.student.sent) {
      console.log('✅ OVERALL STATUS: Some or all notifications sent successfully');
    } else {
      console.log('❌ OVERALL STATUS: All notification attempts failed');
    }
    
    console.log(`Parent notification: ${result.parent.sent ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Student notification: ${result.student.sent ? 'SUCCESS' : 'FAILED'}`);
    console.log('==================================================');

    return result;
  } catch (error) {
    console.error('==================================================');
    console.error('❌ CRITICAL ERROR in attendance notification process:');
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    console.error('==================================================');
    
    return { 
      success: false, 
      error: 'Failed to send attendance notification emails: ' + error.message 
    };
  }
};

module.exports = {
  sendLeaveApplication,
  sendAttendanceNotification,
  transporter
}; 