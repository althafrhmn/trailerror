const nodemailer = require('nodemailer');
const path = require('path');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendLeaveApplication = async (leaveData) => {
  try {
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

    // Format dates
    const formattedFromDate = new Date(fromDate).toLocaleDateString();
    const formattedToDate = new Date(toDate).toLocaleDateString();

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Leave Application: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Leave Application</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p><strong>From:</strong> ${studentName} (${studentId})</p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Duration:</strong> ${formattedFromDate} to ${formattedToDate}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="margin-top: 20px;">
              <strong>Content:</strong>
              <div style="white-space: pre-wrap; margin-top: 10px;">${content}</div>
            </div>
          </div>
        </div>
      `,
      attachments: attachments.map((file, index) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
      }))
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send leave application email');
  }
};

module.exports = {
  sendLeaveApplication,
  transporter
}; 