const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderStatus = require('../models/OrderStatus');
const { calculateLoyaltyPoints } = require('../utils/loyaltyPoints');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/emailService');
const axios = require('axios');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// Create new order
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      cartId,
      email,
      shippingAddress,
      paymentMethod,
      notes,
      discountCode,
      loyaltyPointsUsed = 0
    } = req.body;

    // Get cart from Cart Service
    const cartServiceUrl = process.env.CART_SERVICE_URL || 'http://cart-service:3003';
    let cartResponse;
    
    try {
      const headers = {};
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      
      cartResponse = await axios.get(`${cartServiceUrl}/api/cart?id=${cartId}`, {
        headers,
        withCredentials: true
      });
      
      if (!cartResponse.data || !cartResponse.data.success) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid cart'
        });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch cart information'
      });
    }
    
    const cart = cartResponse.data.cart;
    
    if (!cart || !cart.items || cart.items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }
    
    // Apply discount if any
    let discountAmount = 0;
    if (discountCode) {
      try {
        // Check discount code validity with a dedicated discount service
        // or with admin service that manages discounts
        const adminServiceUrl = process.env.ADMIN_SERVICE_URL || 'http://admin-service:3004';
        const discountResponse = await axios.get(`${adminServiceUrl}/api/discounts/check/${discountCode}`);
        
        if (discountResponse.data && discountResponse.data.success) {
          discountAmount = discountResponse.data.discountAmount;
        }
      } catch (error) {
        console.error('Error checking discount code:', error);
        // Continue without applying discount
      }
    }
    
    // Calculate loyalty points to be used
    const loyaltyPointsValue = loyaltyPointsUsed > 0 ? (loyaltyPointsUsed / 100) : 0;
    
    // Calculate total amount
    const totalBeforeDiscounts = parseFloat(cart.totalAmount);
    const shippingCost = 10.00; // Fixed shipping cost for simplicity
    const taxRate = 0.10; // 10% tax rate
    const taxAmount = (totalBeforeDiscounts - discountAmount - loyaltyPointsValue) * taxRate;
    
    const finalTotal = totalBeforeDiscounts + shippingCost + taxAmount - discountAmount - loyaltyPointsValue;
    
    // Calculate loyalty points earned (10% of total before tax and shipping)
    const loyaltyPointsEarned = calculateLoyaltyPoints(totalBeforeDiscounts - discountAmount - loyaltyPointsValue);
    
    // Create order
    const order = await Order.create({
      userId: req.userId,
      guestId: !req.userId ? (cart.guestId || null) : null,
      email,
      totalAmount: finalTotal,
      shippingCost,
      tax: taxAmount,
      discountCode: discountCode || null,
      discountAmount,
      loyaltyPointsEarned,
      loyaltyPointsUsed,
      currentStatus: 'pending',
      shippingAddress,
      paymentMethod,
      notes,
      paymentStatus: 'completed' // Assuming payment is already processed
    }, { transaction });
    
    // Create order items
    for (const item of cart.items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        productData: item.productData || {
          name: item.productName,
          image: item.imgUrl,
          variant: item.variant
        }
      }, { transaction });
      
      // Update product inventory
      try {
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
        await axios.put(`${productServiceUrl}/api/products/inventory`, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: -item.quantity // Negative to decrease inventory
        });
      } catch (error) {
        console.error('Error updating inventory:', error);
        // Continue processing, we'll handle inventory issues separately
      }
    }
    
    // Create initial order status
    await OrderStatus.create({
      orderId: order.id,
      status: 'pending',
      notes: 'Order created'
    }, { transaction });
    
    // If user is logged in, apply loyalty points and clear their cart
    if (req.userId) {
      // Update user's loyalty points
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
        await axios.put(
          `${userServiceUrl}/api/users/loyalty-points`,
          {
            pointsEarned: loyaltyPointsEarned,
            pointsUsed: loyaltyPointsUsed
          },
          {
            headers: {
              Authorization: req.headers.authorization
            }
          }
        );
      } catch (error) {
        console.error('Error updating loyalty points:', error);
        // Continue processing, we'll handle loyalty points issues separately
      }
    }
    
    // Clear the cart
    try {
      const headers = {};
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      
      await axios.delete(`${cartServiceUrl}/api/cart/clear`, {
        headers,
        withCredentials: true
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Continue processing, cart will eventually expire
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the complete order with items for the response
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          attributes: ['id', 'productId', 'variantId', 'quantity', 'price', 'productData']
        },
        {
          model: OrderStatus,
          attributes: ['id', 'status', 'notes', 'createdAt']
        }
      ],
      order: [
        [OrderStatus, 'createdAt', 'DESC']
      ]
    });
    
    // Send order confirmation email
    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id }
    });
    
    sendOrderConfirmationEmail(completeOrder, orderItems)
      .then(success => {
        console.log('Email sent:', success);
      })
      .catch(error => {
        console.error('Error sending email:', error);
      });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find user's orders
    const { count, rows: orders } = await Order.findAndCountAll({
      where: {
        userId: req.userId
      },
      include: [
        {
          model: OrderStatus,
          attributes: ['id', 'status', 'notes', 'createdAt'],
          limit: 1,
          order: [['createdAt', 'DESC']]
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
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get guest orders
exports.getGuestOrders = async (req, res) => {
  try {
    const { email, orderNumber } = req.body;
    
    if (!email || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email and order number are required'
      });
    }
    
    // Find the order
    const order = await Order.findOne({
      where: {
        id: orderNumber,
        email,
        userId: null // Must be a guest order
      },
      include: [
        {
          model: OrderItem,
          attributes: ['id', 'productId', 'variantId', 'quantity', 'price', 'productData']
        },
        {
          model: OrderStatus,
          attributes: ['id', 'status', 'notes', 'createdAt']
        }
      ],
      order: [
        [OrderStatus, 'createdAt', 'DESC']
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
    console.error('Error getting guest order:', error);
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
    
    // Find the order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          attributes: ['id', 'productId', 'variantId', 'quantity', 'price', 'productData']
        },
        {
          model: OrderStatus,
          attributes: ['id', 'status', 'notes', 'createdAt']
        }
      ],
      order: [
        [OrderStatus, 'createdAt', 'DESC']
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if the user is authorized to view this order
    if (req.userId && order.userId && order.userId !== req.userId) {
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
    console.error('Error getting order details:', error);
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
    
    // Find the order first to check permissions
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if the user is authorized to view this order
    if (req.userId && order.userId && order.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    // Get all status updates for this order
    const statusHistory = await OrderStatus.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      statusHistory
    });
  } catch (error) {
    console.error('Error getting order status history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Find the order
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Create new status entry
    await OrderStatus.create({
      orderId,
      status,
      notes: notes || null,
      updatedBy: req.userId
    }, { transaction });
    
    // Update current status in the order
    await order.update({
      currentStatus: status
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    // Send email notification about status change
    sendOrderStatusEmail(order, status)
      .then(success => {
        console.log('Status update email sent:', success);
      })
      .catch(error => {
        console.error('Error sending status update email:', error);
      });
    
    // Get updated order with status history
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderStatus,
          attributes: ['id', 'status', 'notes', 'createdAt', 'updatedBy'],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Order status updated',
      order: updatedOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause = {};
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
      };
    } else if (req.query.startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(req.query.startDate)
      };
    } else if (req.query.endDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(req.query.endDate)
      };
    }
    
    // Status filter
    if (req.query.status) {
      whereClause.currentStatus = req.query.status;
    }
    
    // Search by order ID or email
    if (req.query.search) {
      if (!isNaN(req.query.search)) {
        // Search by order ID
        whereClause.id = req.query.search;
      } else {
        // Search by email
        whereClause.email = {
          [Op.like]: `%${req.query.search}%`
        };
      }
    }
    
    // Time-based preset filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (req.query.timeRange === 'today') {
      whereClause.createdAt = {
        [Op.gte]: today
      };
    } else if (req.query.timeRange === 'yesterday') {
      whereClause.createdAt = {
        [Op.gte]: yesterday,
        [Op.lt]: today
      };
    } else if (req.query.timeRange === 'thisWeek') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      whereClause.createdAt = {
        [Op.gte]: startOfWeek
      };
    } else if (req.query.timeRange === 'thisMonth') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      whereClause.createdAt = {
        [Op.gte]: startOfMonth
      };
    }
    
    // Find orders
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderStatus,
          attributes: ['id', 'status', 'notes', 'createdAt'],
          limit: 1,
          order: [['createdAt', 'DESC']]
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
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get order statistics for dashboard
exports.getOrderStats = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'year';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    let start, end, groupBy;
    const now = new Date();
    
    // Set time range based on input
    if (startDate && endDate) {
      // Custom range
      start = startDate;
      end = endDate;
      
      // Determine appropriate grouping based on date range
      const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      if (daysDifference <= 31) {
        groupBy = 'day';
      } else if (daysDifference <= 365) {
        groupBy = 'month';
      } else {
        groupBy = 'year';
      }
    } else {
      // Preset ranges
      switch (timeRange) {
        case 'week':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          end = now;
          groupBy = 'day';
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
          groupBy = 'day';
          break;
        case 'quarter':
          start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          end = now;
          groupBy = 'month';
          break;
        case 'year':
        default:
          start = new Date(now.getFullYear(), 0, 1);
          end = now;
          groupBy = 'month';
          break;
      }
    }
    
    // Get total orders and revenue for selected period
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        'id',
        'totalAmount',
        'createdAt'
      ]
    });
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    // Group data by time unit
    const groupedData = {};
    
    if (groupBy === 'day') {
      for (const order of orders) {
        const day = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!groupedData[day]) {
          groupedData[day] = {
            count: 0,
            revenue: 0
          };
        }
        groupedData[day].count += 1;
        groupedData[day].revenue += parseFloat(order.totalAmount);
      }
    } else if (groupBy === 'month') {
      for (const order of orders) {
        const month = `${order.createdAt.getFullYear()}-${(order.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!groupedData[month]) {
          groupedData[month] = {
            count: 0,
            revenue: 0
          };
        }
        groupedData[month].count += 1;
        groupedData[month].revenue += parseFloat(order.totalAmount);
      }
    } else {
      // Year
      for (const order of orders) {
        const year = order.createdAt.getFullYear().toString();
        if (!groupedData[year]) {
          groupedData[year] = {
            count: 0,
            revenue: 0
          };
        }
        groupedData[year].count += 1;
        groupedData[year].revenue += parseFloat(order.totalAmount);
      }
    }
    
    // Convert to array format for charts
    const chartData = Object.keys(groupedData).map(key => ({
      period: key,
      orderCount: groupedData[key].count,
      revenue: groupedData[key].revenue.toFixed(2)
    }));
    
    // Sort by period
    chartData.sort((a, b) => a.period.localeCompare(b.period));
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        timePeriod: {
          start: start.toISOString(),
          end: end.toISOString(),
          groupBy
        },
        chartData
      }
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};