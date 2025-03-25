const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
  },
});

// Send email function
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    // Don't throw the error, just log it
    // This prevents the main operation from failing if email fails
    return null;
  }
};

// Send attendance notification
const sendAttendanceNotification = async (student, attendance, parent) => {
  const subject = `Attendance Alert - ${student.name}`;
  const text = `
    Dear ${parent.name},
    
    This is to inform you that your child ${student.name} was marked ${attendance.status} 
    for ${attendance.subject} class on ${new Date(attendance.date).toLocaleDateString()}.
    
    ${attendance.status === 'late' ? `Late arrival time: ${new Date(attendance.lateArrivalTime).toLocaleTimeString()}` : ''}
    ${attendance.remarks ? `Remarks: ${attendance.remarks}` : ''}
    
    Please login to the system for more details.
    
    Best regards,
    Attendance Management System
  `;

  return sendEmail({
    to: parent.email,
    subject,
    text,
  });
};

// Send leave notification
const sendLeaveNotification = async (student, leave, recipient) => {
  const subject = `Leave Application - ${student.name}`;
  const text = `
    Dear ${recipient.name},
    
    ${student.name} has submitted a leave application:
    
    Type: ${leave.type}
    From: ${new Date(leave.startDate).toLocaleDateString()}
    To: ${new Date(leave.endDate).toLocaleDateString()}
    Reason: ${leave.reason}
    
    Please login to the system to approve/reject this application.
    
    Best regards,
    Attendance Management System
  `;

  return sendEmail({
    to: recipient.email,
    subject,
    text,
  });
};

module.exports = {
  sendEmail,
  sendAttendanceNotification,
  sendLeaveNotification,
}; 