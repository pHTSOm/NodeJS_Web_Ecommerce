// services/user-service/utils/emailService.js
const nodemailer = require('nodemailer');

// Send password reset email
const sendPasswordResetEmail = async (to, resetToken) => {
  try {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration missing - skipping email send');
      return false;
    }
    
    // Create transporter for this request
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail
};