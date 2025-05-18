const { sequelize } = require('../config/db');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderStatus = require('../models/OrderStatus');
const { Op } = require('sequelize'); 
const { calculateLoyaltyPoints } = require('../utils/loyaltyPoints');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const axios = require('axios');

// Helper function to create a guest account
async function createGuestAccount(name, email, shippingAddress) {
  try {
    console.log('Creating guest account for:', email);
    
    // Generate a secure random password
    const password = Math.random().toString(36).slice(2, 10) + 
                     Math.random().toString(36).slice(2, 10);
    
    // Create user account via user service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const userData = {
      name,
      email,
      password,
      address: {
        name: shippingAddress.name,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'Vietnam',
        phone: shippingAddress.phone,
        isDefault: true
      }
    };
    
    const response = await axios.post(
      `${userServiceUrl}/api/auth/register-guest`,
      userData,
      { timeout: 5000 }
    );
    
    if (response.data && response.data.success) {
      console.log('Guest account created successfully:', response.data.user.id);
      return {
        id: response.data.user.id,
        createdPassword: password
      };
    } else {
      throw new Error('Failed to create guest account');
    }
  } catch (error) {
    console.error('Error creating guest account:', error.message);
    
    // Check if user already exists
    if (error.response && error.response.status === 409) {
      console.log('Guest account already exists, returning existing user ID');
      return {
        id: error.response.data.user.id,
        alreadyExists: true
      };
    }
    
    throw error;
  }
}

exports.createOrder = async (req, res) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    console.log('=============================================');
    console.log('CREATE ORDER REQUEST RECEIVED');
    console.log('User authenticated:', req.userId ? 'Yes' : 'No');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('=============================================');
    
    const { items, shipping, payment, discountCode, useLoyaltyPoints } = req.body;
    
    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }
    
    if (!shipping || !shipping.name || !shipping.email || !shipping.address) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Shipping information is incomplete'
      });
    }
    
    if (!payment || !payment.method) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }
    
    // Get user ID from authentication middleware (null for guest)
    let userId = req.userId;
    let accountCreated = false;
    
    // If user is not logged in, create guest account
    if (!userId) {
      try {
        console.log('Guest checkout detected - creating account');
        const guestAccount = await createGuestAccount(
          shipping.name,
          shipping.email,
          {
            name: shipping.name,
            addressLine1: shipping.address,
            addressLine2: shipping.addressLine2 || '',
            city: shipping.city,
            state: shipping.state || shipping.city,
            postalCode: shipping.postalCode,
            country: shipping.country || 'Vietnam',
            phone: shipping.phone
          }
        );
        
        userId = guestAccount.id;
        accountCreated = !guestAccount.alreadyExists;
        console.log(`Using user ID: ${userId} for order (Account ${accountCreated ? 'created' : 'already existed'})`);
      } catch (guestError) {
        console.error('Error creating/finding guest account:', guestError);
        // Continue with guest checkout without user account
        console.log('Continuing with guest checkout without account');
      }
    }
    
    // Calculate order totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
    }
    
    // Fixed shipping fee (can be enhanced later)
    const shippingFee = 10;
    
    // Apply discount if code is valid (this would need to be implemented)
    let discountAmount = 0;
    
    // Loyalty points logic
    let loyaltyPointsUsed = 0;
    if (userId && useLoyaltyPoints) {
      // You'd need to implement fetching user's loyalty points
      // and applying them to the order
      // For now, we'll leave this as 0
    }
    
    // Calculate tax (10% of subtotal)
    const tax = subtotal * 0.1;
    
    // Final total
    const totalAmount = subtotal + shippingFee + tax - discountAmount - loyaltyPointsUsed;
    
    // Calculate loyalty points earned (10% of total)
    const loyaltyPointsEarned = userId ? calculateLoyaltyPoints(totalAmount) : 0;
    
    try {
      // Create the order
      const order = await Order.create({
        userId,
        email: shipping.email,
        totalAmount,
        status: 'pending',
        shippingAddress: {
          name: shipping.name,
          addressLine1: shipping.address,
          addressLine2: shipping.addressLine2 || '',
          city: shipping.city,
          state: shipping.state || shipping.city, // Default to city if state not provided
          postalCode: shipping.postalCode,
          country: shipping.country,
          phone: shipping.phone
        },
        paymentMethod: payment.method,
        paymentStatus: 'pending',
        shippingFee,
        tax,
        discountCode,
        discountAmount,
        loyaltyPointsUsed,
        loyaltyPointsEarned,
        guestAccountCreated: accountCreated
      }, { transaction });
      
      console.log(`Order created with ID: ${order.id}`);
      
      // Create order items
      const orderItems = [];
      for (const item of items) {
        // Fetch product details from product service
        const productData = await fetchProductDetails(item.productId, item.variantId);
        
        const orderItem = await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity || 1,
          price: item.price || 0,
          totalPrice: (item.price || 0) * (item.quantity || 1),
          productData: productData || {
            name: `Product ${item.productId}`,
            image: null,
            variant: item.variantId ? { name: `Variant ${item.variantId}` } : null
          }
        }, { transaction });
        
        orderItems.push(orderItem);
      }
      
      // Create initial order status
      await OrderStatus.create({
        orderId: order.id,
        status: 'pending',
        note: 'Order placed successfully'
      }, { transaction });
      
      // If user is logged in, update their loyalty points
      if (userId) {
        try {
          // This would be an API call to the user service to update points
          // For now, we'll skip this step
        } catch (userError) {
          console.error('Error updating user loyalty points:', userError);
          // Continue with order creation even if points update fails
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Try to send confirmation email (don't block order creation if email fails)
      try {
        // Modify the email function to include account creation info if applicable
        const emailOptions = {
          includeAccountInfo: accountCreated,
          email: shipping.email
        };
        
        sendOrderConfirmationEmail(shipping.email, order, orderItems, emailOptions).catch(emailError => {
          console.error('Error sending confirmation email:', emailError);
        });
      } catch (emailError) {
        console.error('Error initiating email send:', emailError);
      }
      
      // Log the response that will be sent
      console.log('=============================================');
      console.log('ORDER CREATED SUCCESSFULLY');
      console.log('Order ID:', order.id);
      console.log('User ID:', userId);
      console.log('Account created:', accountCreated);
      console.log('Response being sent:', {
        success: true,
        order: {
          id: order.id,
          totalAmount: totalAmount,
          status: 'pending',
          createdAt: order.createdAt,
          accountCreated: accountCreated
        }
      });
      console.log('=============================================');
      
      // Return success response with the created order
      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          id: order.id,
          totalAmount: totalAmount,
          status: 'pending',
          createdAt: order.createdAt,
          accountCreated: accountCreated
        }
      });
    } catch (dbError) {
      console.error('Database error creating order:', dbError);
      if (transaction && !transaction.finished) await transaction.rollback();
      throw dbError;
    }
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to fetch product details from product service
async function fetchProductDetails(productId, variantId) {
  try {
    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
    const response = await axios.get(`${productServiceUrl}/api/products/${productId}`);
    
    if (response.data && response.data.success) {
      const product = response.data.product;
      let variant = null;
      
      if (variantId && product.ProductVariants) {
        variant = product.ProductVariants.find(v => v.id === parseInt(variantId));
      }
      
      return {
        name: product.productName,
        image: product.imgUrl,
        price: product.price,
        variant: variant ? {
          id: variant.id,
          name: variant.name,
          additionalPrice: variant.additionalPrice
        } : null
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching product #${productId} details:`, error.message);
    return null;
  }
}

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find orders for user
    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      orders,
      pagination: {
        total: count,
        totalPages,
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    
    // Find order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.userId && order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get order status history
exports.getOrderStatusHistory = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    
    // Find order
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.userId && order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    // Get status history
    const statusHistory = await OrderStatus.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      orderId,
      currentStatus: order.status,
      statusHistory
    });
  } catch (error) {
    console.error('Error fetching order status history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const orderId = req.params.id;
    const { status, note } = req.body;
    
    if (!status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Find order with its items
    const order = await Order.findByPk(orderId, { 
      transaction,
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        }
      ]
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if status is different from current
    if (order.status === status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order already has this status'
      });
    }
    
    // Previous status (before update)
    const previousStatus = order.status;
    
    // Update order status
    await order.update({ status }, { transaction });
    
    // Add status history entry with admin user info
    await OrderStatus.create({
      orderId,
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.userId, // Admin user ID
      updatedByRole: 'admin'
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    // If the status is changed to "delivered", update product salesCount
    // We do this AFTER committing the transaction to not block the status update
    if (status === 'delivered' && previousStatus !== 'delivered') {
      // Don't await this - fire and forget to avoid blocking the response
      (async () => {
        try {
          console.log(`Order #${orderId} delivered - updating product sales counts`);
          
          // Get the product service URL from environment variable or use default
          const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
          
          // For each order item, update the product salesCount
          if (order.OrderItems && order.OrderItems.length > 0) {
            const updatePromises = order.OrderItems.map(async (item) => {
              // Retry up to 3 times with exponential backoff
              let retries = 0;
              const maxRetries = 3;
              
              while (retries < maxRetries) {
                try {
                  console.log(`Updating salesCount for product #${item.productId} by ${item.quantity}`);
                  
                  const productResponse = await axios.post(
                    `${productServiceUrl}/api/products/${item.productId}/increment-sales`,
                    { quantity: item.quantity },
                    { timeout: 5000 } // Add a timeout to prevent hanging
                  );
                  
                  console.log(`Updated salesCount for product #${item.productId}: Success`);
                  // Success, so break the retry loop
                  break;
                } catch (error) {
                  retries++;
                  console.error(`Attempt ${retries} failed to update salesCount for product #${item.productId}:`, error.message);
                  
                  if (retries >= maxRetries) {
                    console.error(`Failed to update salesCount for product #${item.productId} after ${maxRetries} attempts`);
                  } else {
                    // Exponential backoff: wait longer before each retry
                    const delay = Math.pow(2, retries) * 1000;
                    console.log(`Retrying salesCount update for product #${item.productId} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                }
              }
            });
            
            try {
              // Wait for all update attempts to complete
              await Promise.all(updatePromises);
              console.log(`Completed sales count updates for order #${orderId}`);
            } catch (batchError) {
              console.error(`Error processing batch sales count updates for order #${orderId}:`, batchError);
            }
          }
        } catch (salesCountError) {
          console.error('Error in salesCount update process:', salesCountError);
        }
      })();
    }
    
    // Send notification to user if configured (email, SMS, etc.)
    try {
      const shouldNotify = ['confirmed', 'shipped', 'delivered'].includes(status);
      if (shouldNotify && order.email) {
        // Queue notification in background
        await queueOrderStatusNotification(order.id, order.email, status);
      }
    } catch (notifyError) {
      console.error('Error queueing notification:', notifyError);
      // Continue with status update even if notification fails
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        status: order.status
      }
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Track guest order
exports.trackGuestOrder = async (req, res) => {
  try {
    const { email, orderId } = req.body;
    
    if (!email || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Email and order ID are required'
      });
    }
    
    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        email
      },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error tracking guest order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    // Log query parameters for debugging
    console.log('Order filter params:', req.query);
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const timeFilter = req.query.timeFilter;
    const status = req.query.status;
    
    // Build where clause
    const whereClause = {};
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Apply time filter
    if (timeFilter) {
      const now = new Date();
      let startDate, endDate;
      
      switch (timeFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
          
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
          
        case 'thisWeek':
          // Start of this week (Sunday)
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          
          // End of this week (Saturday)
          endDate = new Date(now);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
          
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
          
        case 'custom':
          // Use custom date range if provided
          if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }
      
      // Add date range to where clause
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }
    }
    
    console.log('Final where clause:', JSON.stringify(whereClause, null, 2));
    
    // Find all orders with filters
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        }
      ],
      order: [['createdAt', 'DESC']], // Most recent first
      limit,
      offset
    });
    
    // Log the retrieved orders for debugging
    console.log(`Found ${orders.length} orders with status filter: ${status || 'all'}`);
    
    // Return properly formatted response
    res.json({
      success: true,
      orders,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get order statistics for admin dashboard
exports.getOrderStats = async (req, res) => {
  try {
    // Get time period from query params
    const period = req.query.period || 'yearly';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    let stats;
    
    switch (period) {
      case 'weekly':
        stats = await getWeeklyStats();
        break;
      case 'monthly':
        stats = await getMonthlyStats();
        break;
      case 'quarterly':
        stats = await getQuarterlyStats();
        break;
      case 'custom':
        if (startDate && endDate) {
          stats = await getCustomPeriodStats(startDate, endDate);
        } else {
          stats = await getYearlyStats(); // Default to yearly if dates not provided
        }
        break;
      case 'yearly':
      default:
        stats = await getYearlyStats();
        break;
    }
    
    res.json({
      success: true,
      period,
      stats
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get order details (admin version)
exports.getOrderDetailsAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Find order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems'
        },
        {
          model: OrderStatus,
          as: 'StatusHistory',
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper functions for statistics
async function getYearlyStats() {
  try {
    // Get the current year's start and end dates
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st
    
    // Count all orders for the current year
    const orderCount = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate total revenue (sum of totalAmount)
    const revenueResult = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Estimate profit (e.g., 30% of revenue)
    const revenue = revenueResult || 0;
    const profit = revenue * 0.3; // Example profit calculation
    
    return {
      orderCount,
      revenue,
      profit
    };
  } catch (error) {
    console.error('Error calculating yearly stats:', error);
    return {
      orderCount: 0,
      revenue: 0,
      profit: 0
    };
  }
}

// Get order status history (admin version)
exports.getOrderStatusHistoryAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Find order
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get status history
    const statusHistory = await OrderStatus.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      orderId,
      currentStatus: order.status,
      statusHistory
    });
  } catch (error) {
    console.error('Error fetching order status history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

async function getQuarterlyStats() {
  // Implementation would query database for quarterly stats
  return {
    orderCount: 0,
    revenue: 0,
    profit: 0,
    // Additional stats...
  };
}

async function getMonthlyStats() {
  // Implementation would query database for monthly stats
  return {
    orderCount: 0,
    revenue: 0,
    profit: 0,
    // Additional stats...
  };
}

async function getWeeklyStats() {
  // Implementation would query database for weekly stats
  return {
    orderCount: 0,
    revenue: 0,
    profit: 0,
    // Additional stats...
  };
}

async function getCustomPeriodStats(startDate, endDate) {
  // Implementation would query database for custom period stats
  return {
    orderCount: 0,
    revenue: 0,
    profit: 0,
    // Additional stats...
  };
}