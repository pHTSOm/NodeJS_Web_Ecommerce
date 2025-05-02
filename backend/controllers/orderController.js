const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const User = require('../models/User');
const Address = require('../models/Address');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// Create a new order
// Get all orders for a user
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Find all orders for the user
        const { count, rows: orders } = await Order.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: OrderItem,
                    attributes: ['productId', 'productName', 'variantName', 'quantity', 'unitPrice', 'totalPrice'],
                }
            ]
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
                hasPrev: page > 1,
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Get single order details
exports.getOrderDetails = async (req, res) => {
    try{
        const orderId = req.params.id;
        const userId = req.user.id;

        // Find the order
        const order = await Order.findOne({
            where: {
                id: orderId,
                userId: userId
            },
            include: [
                {
                    model: OrderItem,
                    include: [
                        {
                            model: Product,
                            attributes: ['id', 'productName', 'imageUrl', 'category', 'brand'],
                        },
                        {
                            model: ProductVariant,
                            attributes: ['id', 'name', 'description', 'sku'],
                        }
                    ]
            }]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            order
        })
    } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Get orders by guest email
exports.getGuestOrders = async (req, res) => {
    try{
        const { email, orderNumber } = req.body;

        if (!email || !orderNumber) {
            return res.status(400).json({
                success: false,
                message: 'Email and order number are required',
            });
        }

        // Find the order
        const order = await Order.findOne({
            where: {
                guestEmail: email,
                orderNumber
            },
            include: [
                {
                    model: OrderItem,
                    include: [
                        {
                            model: Product,
                            attributes: ['id', 'productName', 'imageUrl', 'category', 'brand'],
                        }
                    ]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
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
            message: 'Server error',
        });
    }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res) => {
    try{
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;  
        const offset = (page - 1) * limit; 

        // Filter by status if provided
        const whereClause = {};
        if (req.query.status) {
            whereClause.status = req.query.status;
        }

        // Find all orders
        const { count, rows: orders } = await Order.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email'],
                }
            ]
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
                hasPrev: page > 1,
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};


// Admin: Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      
      // Find and update the order
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      await order.update({ status });
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        order
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
  
  exports.createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        items,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        contactPhone,
        contactEmail,
        paymentMethod,
        notes,
        createAccount
      } = req.body;
      
      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Order must contain at least one item'
        });
      }
      
      if (!shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip || !contactPhone || !contactEmail) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'All shipping information is required'
        });
      }
      
      // Get user ID if authenticated
      let userId = req.user ? req.user.id : null;
      let newUserCreated = false;
      let authToken = null;
      
      // If guest checkout with create account option
      if (!userId && createAccount) {
        // Check if user with this email already exists
        const existingUser = await User.findOne({
          where: { email: contactEmail }
        });
        
        if (existingUser) {
          // User exists - they should log in
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'An account with this email already exists. Please login.'
          });
        }
        
        // Create a random password and hash it
        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        
        // Create new user
        const newUser = await User.create({
          email: contactEmail,
          password: hashedPassword,
          name: shippingName
        }, { transaction });
        
        userId = newUser.id;
        newUserCreated = true;
        authToken = generateToken(userId);
        
        // Also create address for the user
        await Address.create({
          userId,
          name: shippingName,
          addressLine1: shippingAddress,
          city: shippingCity,
          state: shippingState,
          postalCode: shippingZip,
          country: shippingCountry || 'Vietnam',
          phone: contactPhone,
          isDefault: true
        }, { transaction });
      }
      
      // If user is logged in but no address, save this one
      if (userId && req.user) {
        const addressCount = await Address.count({
          where: { userId }
        });
        
        if (addressCount === 0) {
          await Address.create({
            userId,
            name: shippingName,
            addressLine1: shippingAddress,
            city: shippingCity,
            state: shippingState,
            postalCode: shippingZip,
            country: shippingCountry || 'Vietnam',
            phone: contactPhone,
            isDefault: true
          }, { transaction });
        }
      }
      
      // Calculate order total
      let totalAmount = 0;
      let totalItems = 0;
      
      // Validate and prepare order items
      const orderItems = [];
      
      for (const item of items) {
        // Get product info
        const product = await Product.findByPk(item.productId, { transaction });
        
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item.productId} not found`
          });
        }
        
        // Get variant info if specified
        let variant = null;
        let variantPrice = 0;
        
        if (item.variantId) {
          variant = await ProductVariant.findOne({
            where: {
              id: item.variantId,
              productId: item.productId
            },
            transaction
          });
          
          if (!variant) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              message: `Variant with ID ${item.variantId} not found for product ${item.productId}`
            });
          }
          
          // Check stock availability
          if (variant.stock < item.quantity) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for variant ${variant.name} of product ${product.productName}`
            });
          }
          
          // Update variant stock
          await variant.update({
            stock: variant.stock - item.quantity
          }, { transaction });
          
          variantPrice = variant.additionalPrice || 0;
        } else {
          // Check main product stock availability
          if (product.stock < item.quantity) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product ${product.productName}`
            });
          }
          
          // Update product stock
          await product.update({
            stock: product.stock - item.quantity,
            salesCount: (product.salesCount || 0) + item.quantity
          }, { transaction });
        }
        
        const unitPrice = parseFloat(product.price) + parseFloat(variantPrice);
        const itemTotal = unitPrice * item.quantity;
        
        totalAmount += itemTotal;
        totalItems += item.quantity;
        
        orderItems.push({
          productId: product.id,
          variantId: variant ? variant.id : null,
          productName: product.productName,
          variantName: variant ? variant.name : null,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal
        });
      }
      
      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      // Create order
      const order = await Order.create({
        userId,
        guestEmail: !userId ? contactEmail : null,
        orderNumber,
        totalAmount,
        totalItems,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry: shippingCountry || 'Vietnam',
        contactPhone,
        contactEmail,
        paymentMethod: paymentMethod || 'cash_on_delivery',
        notes
      }, { transaction });
      
      // Create order items
      for (const item of orderItems) {
        await OrderItem.create({
          orderId: order.id,
          ...item
        }, { transaction });
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Respond with order details
      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status
        },
        newAccount: newUserCreated ? {
          message: 'An account has been created for you',
          email: contactEmail,
          token: authToken
        } : null
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };