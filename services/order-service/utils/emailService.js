const nodemailer = require('nodemailer');

exports.sendOrderConfirmationEmail = async (to, order, orderItems) => {
  try {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration missing - skipping email send');
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
    
    // Format items for email
    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.productData.name} ${item.productData.variant ? `(${item.productData.variant.name})` : ''}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          $${parseFloat(item.price).toFixed(2)}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          $${parseFloat(item.totalPrice).toFixed(2)}
        </td>
      </tr>
    `).join('');
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Order Confirmation #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0a1d37; text-align: center;">Order Confirmation</h1>
          <p>Thank you for your purchase! Your order has been received and is being processed.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #0a1d37;">Order #${order.id}</h2>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'}</p>
          </div>
          
          <h3 style="color: #0a1d37;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #0a1d37; color: white;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Quantity</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 8px; text-align: right;">$${(parseFloat(order.totalAmount) - parseFloat(order.shippingFee) + parseFloat(order.discountAmount) + parseFloat(order.loyaltyPointsUsed)).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right;"><strong>Shipping:</strong></td>
                <td style="padding: 8px; text-align: right;">$${parseFloat(order.shippingFee).toFixed(2)}</td>
              </tr>
              ${parseFloat(order.discountAmount) > 0 ? `
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right;"><strong>Discount:</strong></td>
                <td style="padding: 8px; text-align: right;">-$${parseFloat(order.discountAmount).toFixed(2)}</td>
              </tr>
              ` : ''}
              ${parseFloat(order.loyaltyPointsUsed) > 0 ? `
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right;"><strong>Loyalty Points:</strong></td>
                <td style="padding: 8px; text-align: right;">-$${parseFloat(order.loyaltyPointsUsed).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 16px;">$${parseFloat(order.totalAmount).toFixed(2)}</td>
              </tr>
              ${parseFloat(order.loyaltyPointsEarned) > 0 ? `
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right;"><strong>Loyalty Points Earned:</strong></td>
                <td style="padding: 8px; text-align: right;">$${parseFloat(order.loyaltyPointsEarned).toFixed(2)}</td>
              </tr>
              ` : ''}
            </tfoot>
          </table>
          
          <h3 style="color: #0a1d37;">Shipping Information</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p><strong>Name:</strong> ${order.shippingAddress.name}</p>
            <p><strong>Address:</strong> ${order.shippingAddress.address}</p>
            <p><strong>City:</strong> ${order.shippingAddress.city}</p>
            <p><strong>Country:</strong> ${order.shippingAddress.country}</p>
            <p><strong>Postal Code:</strong> ${order.shippingAddress.postalCode}</p>
            <p><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
          </div>
          
          <p style="margin-top: 30px;">If you have any questions about your order, please contact our customer service.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};