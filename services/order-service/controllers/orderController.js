const { sequelize } = require('../config/db');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderStatus = require('../models/OrderStatus');
const { calculateLoyaltyPoints } = require('../utils/loyaltyPoints');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const axios = require('axios');

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
    const userId = req.userId;
    
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
        loyaltyPointsEarned
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
        sendOrderConfirmationEmail(shipping.email, order, orderItems).catch(emailError => {
          console.error('Error sending confirmation email:', emailError);
        });
      } catch (emailError) {
        console.error('Error initiating email send:', emailError);
      }
      
      // Log the response that will be sent
      console.log('=============================================');
      console.log('ORDER CREATED SUCCESSFULLY');
      console.log('Order ID:', order.id);
      console.log('Response being sent:', {
        success: true,
        order: {
          id: order.id,
          totalAmount: totalAmount,
          status: 'pending',
          createdAt: order.createdAt
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
          createdAt: order.createdAt
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
    
    // Find order
    const order = await Order.findByPk(orderId, { transaction });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order status
    await order.update({ status }, { transaction });
    
    // Add status history entry
    await OrderStatus.create({
      orderId,
      status,
      note: note || `Status updated to ${status}`
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        status: order.status
      }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
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
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Time filtering
    const timeFilter = req.query.timeFilter;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    let dateWhere = {};
    
    if (timeFilter) {
      const now = new Date();
      
      switch (timeFilter) {
        case 'today':
          const todayStart = new Date(now.setHours(0, 0, 0, 0));
          const todayEnd = new Date(now.setHours(23, 59, 59, 999));
          dateWhere = {
            createdAt: {
              [Op.between]: [todayStart, todayEnd]
            }
          };
          break;
        case 'yesterday':
          const yesterdayStart = new Date(now);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          yesterdayStart.setHours(0, 0, 0, 0);
          
          const yesterdayEnd = new Date(now);
          yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
          yesterdayEnd.setHours(23, 59, 59, 999);
          
          dateWhere = {
            createdAt: {
              [Op.between]: [yesterdayStart, yesterdayEnd]
            }
          };
          break;
        case 'thisWeek':
          const curr = new Date();
          const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay()));
          firstDay.setHours(0, 0, 0, 0);
          
          const lastDay = new Date(curr);
          lastDay.setDate(firstDay.getDate() + 6);
          lastDay.setHours(23, 59, 59, 999);
          
          dateWhere = {
            createdAt: {
              [Op.between]: [firstDay, lastDay]
            }
          };
          break;
        case 'thisMonth':
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          
          dateWhere = {
            createdAt: {
              [Op.between]: [firstDayOfMonth, lastDayOfMonth]
            }
          };
          break;
        case 'custom':
          if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(0, 0, 0, 0);
            
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            
            dateWhere = {
              createdAt: {
                [Op.between]: [startDateTime, endDateTime]
              }
            };
          }
          break;
        default:
          // No filter
          break;
      }
    }
    
    // Find all orders
    const { count, rows: orders } = await Order.findAndCountAll({
      where: dateWhere,
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
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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

// Helper functions for statistics
async function getYearlyStats() {
  // Implementation would query database for yearly stats
  // This is a placeholder
  return {
    orderCount: 0,
    revenue: 0,
    profit: 0,
    // Additional stats...
  };
}

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