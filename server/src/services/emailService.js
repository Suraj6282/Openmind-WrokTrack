const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"OpenMind WorkTrack" <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to OpenMind WorkTrack!</h2>
      <p>Hello ${user.name},</p>
      <p>Your account has been created successfully. Here are your details:</p>
      <ul>
        <li><strong>Employee ID:</strong> ${user.employeeId}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Department:</strong> ${user.department?.name || 'Not assigned'}</li>
      </ul>
      <p>You can now login to your account using your email and password.</p>
      <p>
        <a href="${process.env.CLIENT_URL}/login" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Login to Dashboard
        </a>
      </p>
      <p>If you have any questions, please contact HR.</p>
      <p>Best regards,<br>OpenMind WorkTrack Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject: 'Welcome to OpenMind WorkTrack',
    html
  });
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <p>
        <a href="${resetUrl}" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link: ${resetUrl}</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>OpenMind WorkTrack Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject: 'Password Reset Request',
    html
  });
};

// Send leave approval email
exports.sendLeaveApprovalEmail = async (leave, status) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Leave Application ${status}</h2>
      <p>Hello ${leave.employee.name},</p>
      <p>Your leave application has been <strong>${status}</strong>.</p>
      <ul>
        <li><strong>Type:</strong> ${leave.type} leave</li>
        <li><strong>Duration:</strong> ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}</li>
        <li><strong>Days:</strong> ${leave.days}</li>
        <li><strong>Reason:</strong> ${leave.reason}</li>
      </ul>
      <p>
        <a href="${process.env.CLIENT_URL}/leave" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Leave History
        </a>
      </p>
      <p>Best regards,<br>HR Team</p>
    </div>
  `;

  return sendEmail({
    email: leave.employee.email,
    subject: `Leave Application ${status}`,
    html
  });
};

// Send salary slip email
exports.sendSalarySlipEmail = async (employee, payroll) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Salary Slip Generated</h2>
      <p>Hello ${employee.name},</p>
      <p>Your salary slip for ${payroll.month} ${payroll.year} has been generated.</p>
      <ul>
        <li><strong>Gross Pay:</strong> ₹${payroll.grossPay}</li>
        <li><strong>Deductions:</strong> ₹${payroll.deductions.total}</li>
        <li><strong>Net Payable:</strong> ₹${payroll.netPayable}</li>
      </ul>
      <p>
        <a href="${process.env.CLIENT_URL}/salary-slips/${payroll._id}" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Salary Slip
        </a>
      </p>
      <p>Please sign the salary slip digitally to download.</p>
      <p>Best regards,<br>Finance Team</p>
    </div>
  `;

  return sendEmail({
    email: employee.email,
    subject: `Salary Slip - ${payroll.month} ${payroll.year}`,
    html
  });
};

// Send notification email
exports.sendNotificationEmail = async (user, notification) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${notification.title}</h2>
      <p>Hello ${user.name},</p>
      <p>${notification.message}</p>
      ${notification.link ? `
        <p>
          <a href="${notification.link}" 
             style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Details
          </a>
        </p>
      ` : ''}
      <p>Best regards,<br>OpenMind WorkTrack Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject: notification.title,
    html
  });
};

// Send bulk emails
exports.sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, email: email.email, result });
    } catch (error) {
      results.push({ success: false, email: email.email, error: error.message });
    }
  }
  
  return results;
};

// Verify email configuration
exports.verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = sendEmail;