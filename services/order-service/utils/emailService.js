const { createTransporter } = require('../config/email');
const path = require('path');
const fs = require('fs');

// HTML email template for order confirmation
const getOrderConfirmationTemplate = (order, orderItems) => {
  // Format order data for email
  const formattedItems = orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productData.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${parseFloat(item.price).toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0a1d37; color: white; padding: 20px; text-align: center; }
        .order-details { margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f2f2f2; text-align: left; padding: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 0.8em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Order #${order.id}</p>
        </div>
        
        <div class="order-details">
          <h2>Thank you for your order!</h2>
          <p>Your order has been received and is now being processed. Below are your order details:</p>
          
          <h3>Order Summary</h3>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Order Status:</strong> ${order.currentStatus}</p>
          
          <h3>Shipping Address</h3>
          <p>
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
            ${order.shippingAddress.country}<br>
            ${order.shippingAddress.phone}
          </p>
          
          <h3>Items Ordered</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${formattedItems}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px;"><strong>Subtotal:</strong></td>
                <td style="padding: 10px;">$${(parseFloat(order.totalAmount) - parseFloat(order.tax) - parseFloat(order.shippingCost) + parseFloat(order.discountAmount)).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px;"><strong>Tax:</strong></td>
                <td style="padding: 10px;">$${parseFloat(order.tax).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px;"><strong>Shipping:</strong></td>
                <td style="padding: 10px;">$${parseFloat(order.shippingCost).toFixed(2)}</td>
              </tr>
              ${order.discountAmount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px;"><strong>Discount:</strong></td>
                <td style="padding: 10px;">-$${parseFloat(order.discountAmount).toFixed(2)}</td>
              </tr>` : ''}
              ${order.loyaltyPointsUsed > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px;"><strong>Loyalty Points Used:</strong></td>
                <td style="padding: 10px;">-$${(order.loyaltyPointsUsed / 100).toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px;"><strong>Total:</strong></td>
                <td style="padding: 10px;"><strong>$${parseFloat(order.totalAmount).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
          
          ${order.loyaltyPointsEarned > 0 ? `
          <p><strong>Loyalty Points Earned:</strong> ${order.loyaltyPointsEarned} points (Worth $${(order.loyaltyPointsEarned / 100).toFixed(2)} on your next purchase)</p>` : ''}
          
          <p>You will receive an email update when your order ships.</p>
        </div>
        
        <div class="footer">
          <p>If you have any questions, please contact our customer service.</p>
          <p>&copy; 2025 Computer Parts Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order, orderItems) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration missing - skipping email send');
      return false;
    }
    
    const transporter = createTransporter();
    const template = getOrderConfirmationTemplate(order, orderItems);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.email,
      subject: `Order Confirmation #${order.id}`,
      html: template
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

// Send order status update email
const sendOrderStatusEmail = async (order, newStatus) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration missing - skipping email send');
      return false;
    }
    
    const transporter = createTransporter();
    
    let subject, content;
    switch (newStatus) {
      case 'confirmed':
        subject = `Order #${order.id} Confirmed`;
        content = `<p>Your order has been confirmed and is being prepared.</p>`;
        break;
      case 'processing':
        subject = `Order #${order.id} is Being Processed`;
        content = `<p>Your order is now being processed.</p>`;
        break;
      case 'shipped':
        subject = `Order #${order.id} Shipped`;
        content = `<p>Good news! Your order has been shipped.</p>`;
        break;
      case 'delivered':
        subject = `Order #${order.id} Delivered`;
        content = `<p>Your order has been delivered. Thank you for shopping with us!</p>`;
        break;
      case 'cancelled':
        subject = `Order #${order.id} Cancelled`;
        content = `<p>Your order has been cancelled. If you didn't request this cancellation, please contact our customer service.</p>`;
        break;
      default:
        subject = `Order #${order.id} Update`;
        content = `<p>Your order status has been updated to ${newStatus}.</p>`;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0a1d37; color: white; padding: 20px; text-align: center; }
            .content { margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.8em; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Status Update</h1>
              <p>Order #${order.id}</p>
            </div>
            
            <div class="content">
              <h2>Order Status: ${newStatus.toUpperCase()}</h2>
              ${content}
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost'}/orders/${order.id}">View your order details</a></p>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact our customer service.</p>
              <p>&copy; 2025 Computer Parts Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Order status email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail
};