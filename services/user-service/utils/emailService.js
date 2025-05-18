// services/user-service/utils/emailService.js
const nodemailer = require('nodemailer');

const sendGoogleAuthPassword = async (to, password) => {
  try {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration missing - skipping Google auth password email');
      return false;
    }
    
    // Create transporter for this request
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Computer Store Account Password',
      html: `
        <h1>Welcome to Computer Components Store!</h1>
        <p>Thank you for signing up using Google authentication.</p>
        <p>We've created a password for you to use when logging in directly:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-family: monospace; font-size: 18px; margin: 0;">${password}</p>
        </div>
        <p>You can use this password along with your email <strong>${to}</strong> to log in directly to our platform.</p>
        <p>For security reasons, we recommend changing this password after your first login.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Thank you,<br>Computer Components Store Team</p>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Google auth password email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending Google auth password email:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in sendGoogleAuthPassword:', error);
    return false;
  }
};

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

const sendGuestAuthPassword = async (to, password) => {
  try {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration missing - skipping guest account email');
      return false;
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Computer Store Account Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h1 style="color: #0a1d37; text-align: center;">Welcome to Computer Components Store!</h1>
          <p>Thank you for your purchase! We've created an account for you to easily track your orders.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <p>You can use these credentials to log in to our website to:</p>
          <ul>
            <li>Track your order status</li>
            <li>View your order history</li>
            <li>Manage your shipping addresses</li>
            <li>Use earned loyalty points for future purchases</li>
          </ul>
          
          <p>For security reasons, we recommend changing your password after your first login.</p>
          
          <p>If you have any questions, please don't hesitate to contact our customer service.</p>
          
          <p>Thank you for shopping with us!</p>
          <p>Computer Components Store Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Guest account email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending guest account email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendGoogleAuthPassword,
  sendGuestAuthPassword
};