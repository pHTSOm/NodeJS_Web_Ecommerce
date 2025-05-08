const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const { Op } = require("sequelize");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { sequelize } = require("../config/db");

// Create or get cart
exports.getCart = async (req, res) => {
  try {
    console.log('getCart called', {
      url: req.url,
      method: req.method,
      userId: req.userId,
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: !!req.cookies,
      guestCookieExists: !!req.cookies['guest_cart_id'],
      headers: Object.keys(req.headers)
    });
    
    let cart;
    let userId = req.userId; // From auth middleware
    let guestId = req.cookies["guest_cart_id"];

    // If user is logged in
    if (userId) {
      // Find active cart for user
      cart = await Cart.findOne({
        where: {
          userId,
          status: "active",
        },
        include: [
          {
            model: CartItem,
            as: "cartItems",
          },
        ],
      });

      // If guest had a cart before logging in, merge it
      if (!cart && guestId) {
        const guestCart = await Cart.findOne({
          where: {
            guestId,
            status: "active",
          },
          include: [
            {
              model: CartItem,
              as: "cartItems",
            },
          ],
        });

        if (guestCart) {
          // Update the guest cart to belong to the user
          await guestCart.update({
            userId,
            guestId: null,
            lastActivity: new Date(),
          });

          cart = guestCart;

          // Clear guest cookie
          res.clearCookie("guest_cart_id");
        }
      }

      // If still no cart, create one
      if (!cart) {
        cart = await Cart.create({
          userId,
          status: "active",
          lastActivity: new Date(),
        });
      }
    }
    // For guest users
    else {
      console.log('Guest user, guest ID:', guestId);
      // If no guestId, create one
      if (!guestId) {
        guestId = uuidv4();
        // Set cookie with guestId
        res.cookie("guest_cart_id", guestId, {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          httpOnly: true,
        });
      }

      // Find or create cart for guest
      cart = await Cart.findOne({
        where: {
          guestId,
          status: "active",
        }
      });
      
      if (!cart) {
        console.log('Creating new cart for guest');
        cart = await Cart.create({
          guestId,
          status: "active",
          lastActivity: new Date(),
        });
      }
    }
    
    console.log('Cart found/created:', cart.id);
    
    // Get cart items
    const items = await CartItem.findAll({
      where: { cartId: cart.id },
    });
    
    console.log(`Found ${items.length} items in cart`);

    // Calculate totals    
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    res.json({
      success: true,
      cart: {
        id: cart.id,
        items: items.map((item) => ({
          ...item.toJSON(),
          productData: item.productData || {}, // Ensure productData is never null
        })),
        totalQuantity,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Add item to cart
exports.addItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { productId, variantId, quantity = 1 } = req.body;

    // Get cart (will create one if needed)
    let userId = req.userId;
    let guestId = req.cookies["guest_cart_id"];

    let cart;

    if (userId) {
      cart = await Cart.findOne(
        {
          where: {
            userId,
            status: "active",
          },
        },
        { transaction }
      );

      if (!cart) {
        cart = await Cart.create(
          {
            userId,
            status: "active",
            lastActivity: new Date(),
          },
          { transaction }
        );
      }
    } else {
      if (!guestId) {
        guestId = uuidv4();
        res.cookie("guest_cart_id", guestId, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        });
      }

      cart = await Cart.findOne(
        {
          where: {
            guestId,
            status: "active",
          },
        },
        { transaction }
      );

      if (!cart) {
        cart = await Cart.create(
          {
            guestId,
            status: "active",
            lastActivity: new Date(),
          },
          { transaction }
        );
      }
    }

    // Validate product with product service
    try {
      const productServiceUrl =
        process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";
      const productResponse = await axios.get(
        `${productServiceUrl}/api/products/${productId}`
      );

      if (!productResponse.data.success) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const product = productResponse.data.product;

      // Check if variant exists if variantId is provided
      let variant = null;
      let variantPrice = 0;

      if (variantId && product.ProductVariants) {
        variant = product.ProductVariants.find(
          (v) => v.id === parseInt(variantId)
        );

        if (!variant) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: "Product variant not found",
          });
        }

        variantPrice = parseFloat(variant.additionalPrice) || 0;
      }

      // Check inventory
      const stock = variant ? variant.stock : product.stock;

      if (stock < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Not enough stock available",
        });
      }

      // Calculate price
      const basePrice = parseFloat(product.price);
      const finalPrice = basePrice + variantPrice;

      // Check if item already exists in cart
      let cartItem = await CartItem.findOne(
        {
          where: {
            cartId: cart.id,
            productId,
            ...(variantId ? { variantId } : { variantId: null }),
          },
        },
        { transaction }
      );

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + quantity;

        // Check stock again
        if (stock < newQuantity) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Not enough stock available for requested quantity",
          });
        }

        await cartItem.update(
          {
            quantity: newQuantity,
          },
          { transaction }
        );
      } else {
        // Create new cart item
        cartItem = await CartItem.create(
          {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            quantity,
            price: finalPrice,
            productData: {
              name: product.productName,
              image: product.imgUrl,
              variant: variant
                ? {
                    id: variant.id,
                    name: variant.name,
                    additionalPrice: variant.additionalPrice,
                  }
                : null,
            },
          },
          { transaction }
        );
      }

      // Update cart last activity
      await cart.update(
        {
          lastActivity: new Date(),
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // Return updated cart
      const updatedItems = await CartItem.findAll({
        where: { cartId: cart.id },
      });

      const totalQuantity = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      res.json({
        success: true,
        message: "Item added to cart",
        cart: {
          id: cart.id,
          items: updatedItems.map((item) => ({
            ...item.toJSON(),
            productData: item.productData || {},
          })),
          totalQuantity,
          totalAmount,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error validating product:", error);
      return res.status(500).json({
        success: false,
        message: "Error validating product",
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding item to cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update cart item quantity
exports.updateItemQuantity = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const itemId = req.params.itemId;
    const { quantity } = req.body;

    if (quantity < 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Get cart item
    const cartItem = await CartItem.findByPk(itemId, { transaction });

    if (!cartItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Get cart
    const cart = await Cart.findByPk(cartItem.cartId, { transaction });

    // Verify cart belongs to user or guest
    const userId = req.userId;
    const guestId = req.cookies["guest_cart_id"];
    // Add more detailed logging
    console.log("Cart ownership check:", {
      cartUserId: cart.userId,
      requestUserId: userId,
      cartGuestId: cart.guestId,
      cookieGuestId: guestId,
    });

    if (
      userId &&
      cart.userId !== userId &&
      (!guestId || cart.guestId !== guestId)
    ) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this cart",
        debug: {
          cartUserId: cart.userId,
          requestUserId: userId,
          cartGuestId: cart.guestId,
          cookieGuestId: guestId,
        },
      });
    }

    // Check inventory with product service
    try {
      const productServiceUrl =
        process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";
      const productResponse = await axios.get(
        `${productServiceUrl}/api/products/${cartItem.productId}`
      );

      if (!productResponse.data.success) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const product = productResponse.data.product;

      // Check if variant exists if variantId is provided
      let variant = null;

      if (cartItem.variantId && product.ProductVariants) {
        variant = product.ProductVariants.find(
          (v) => v.id === parseInt(cartItem.variantId)
        );

        if (!variant) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: "Product variant not found",
          });
        }
      }

      // Check inventory
      const stock = variant ? variant.stock : product.stock;

      if (stock < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Not enough stock available",
        });
      }

      // Update quantity
      await cartItem.update(
        {
          quantity,
        },
        { transaction }
      );

      // Update cart last activity
      await cart.update(
        {
          lastActivity: new Date(),
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // Return updated cart
      const updatedItems = await CartItem.findAll({
        where: { cartId: cart.id },
      });

      const totalQuantity = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      res.json({
        success: true,
        message: "Cart item updated",
        cart: {
          id: cart.id,
          items: updatedItems.map((item) => ({
            ...item.toJSON(),
            productData: item.productData || {},
          })),
          totalQuantity,
          totalAmount,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error validating product:", error);
      return res.status(500).json({
        success: false,
        message: "Error validating product",
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating cart item:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { itemId } = req.params;

    // Get cart item
    const cartItem = await CartItem.findByPk(itemId, { transaction });

    if (!cartItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Get cart
    const cart = await Cart.findByPk(cartItem.cartId, { transaction });

    // Verify cart belongs to user or guest
    const userId = req.userId;
    const guestId = req.cookies["guest_cart_id"];

    if (
      (userId && cart.userId !== userId) ||
      (!userId && cart.guestId !== guestId)
    ) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this cart",
      });
    }

    // Delete cart item
    await cartItem.destroy({ transaction });

    // Update cart last activity
    await cart.update(
      {
        lastActivity: new Date(),
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    // Return updated cart
    const updatedItems = await CartItem.findAll({
      where: { cartId: cart.id },
    });

    const totalQuantity = updatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    res.json({
      success: true,
      message: "Item removed from cart",
      cart: {
        id: cart.id,
        items: updatedItems.map((item) => ({
          ...item.toJSON(),
          productData: item.productData || {},
        })),
        totalQuantity,
        totalAmount,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error removing item from cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Get cart
    let userId = req.userId;
    let guestId = req.cookies["guest_cart_id"];

    let cart;

    if (userId) {
      cart = await Cart.findOne(
        {
          where: {
            userId,
            status: "active",
          },
        },
        { transaction }
      );
    } else if (guestId) {
      cart = await Cart.findOne(
        {
          where: {
            guestId,
            status: "active",
          },
        },
        { transaction }
      );
    }

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Delete all cart items
    await CartItem.destroy(
      {
        where: { cartId: cart.id },
      },
      { transaction }
    );

    // Update cart last activity
    await cart.update(
      {
        lastActivity: new Date(),
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    res.json({
      success: true,
      message: "Cart cleared",
      cart: {
        id: cart.id,
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Associate guest cart with user account
exports.associateCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Associate cart called');
    console.log('Auth headers:', req.headers.authorization ? 'Present' : 'None');
    
    const userId = req.userId;
    const guestId = req.cookies['guest_cart_id'];
    
    console.log('Association data:', { userId, guestId });

    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!guestId) {
      // No guest cart to associate, simply return success
      console.log('No guest cart ID found in cookies');
      await transaction.commit();
      return res.json({
        success: true,
        message: 'No guest cart to associate'
      });
    }
    
    // Find user's active cart
    let userCart = await Cart.findOne({
      where: {
        userId,
        status: 'active'
      },
      transaction
    });
    
    // Find guest cart
    const guestCart = await Cart.findOne({
      where: {
        guestId,
        status: 'active'
      },
      include: [{
        model: CartItem,
        as: 'cartItems'
      }],
      transaction
    });
    
    if (!guestCart) {
      console.log('Guest cart not found with ID:', guestId);
      await transaction.commit();
      return res.json({
        success: true,
        message: 'No guest cart found to associate'
      });
    }
    
    console.log(`Found guest cart #${guestCart.id} with ${guestCart.cartItems?.length || 0} items`);
    
    // If user doesn't have an active cart, simply convert guest cart
    if (!userCart) {
      console.log('User has no active cart, converting guest cart to user cart');
      await guestCart.update({
        userId,
        guestId: null,
        lastActivity: new Date()
      }, { transaction });
      
      // Clear the guest cart cookie
      res.clearCookie('guest_cart_id');
      
      await transaction.commit();
      
      return res.json({
        success: true,
        message: 'Guest cart associated with user account'
      });
    }
    
    console.log(`Found user cart #${userCart.id}, merging with guest cart`);
    
    // Get guest cart items
    const guestItems = await CartItem.findAll({
      where: {
        cartId: guestCart.id
      },
      transaction
    });
    
    // Get user's cart items
    const userItems = await CartItem.findAll({
      where: {
        cartId: userCart.id
      },
      transaction
    });
    
    console.log(`Merging ${guestItems.length} guest items with ${userItems.length} user items`);
    
    // Merge items
    for (const guestItem of guestItems) {
      // Check if user already has this product + variant combo
      const existingItem = userItems.find(
        item => item.productId === guestItem.productId && 
               item.variantId === guestItem.variantId
      );
      
      if (existingItem) {
        console.log(`Updating existing item quantity for product #${guestItem.productId}`);
        // Update quantity
        await existingItem.update({
          quantity: existingItem.quantity + guestItem.quantity
        }, { transaction });
        
        // Delete guest item
        await guestItem.destroy({ transaction });
      } else {
        console.log(`Moving guest item for product #${guestItem.productId} to user cart`);
        // Move item to user's cart
        await guestItem.update({
          cartId: userCart.id
        }, { transaction });
      }
    }
    
    // Mark guest cart as merged
    await guestCart.update({
      status: 'merged',
      lastActivity: new Date()
    }, { transaction });
    
    // Update user cart last activity
    await userCart.update({
      lastActivity: new Date()
    }, { transaction });
    
    // Clear the guest cart cookie
    res.clearCookie('guest_cart_id');
    
    // Commit transaction
    await transaction.commit();
    
    // Return updated cart
    const updatedItems = await CartItem.findAll({
      where: { cartId: userCart.id }
    });
    
    const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      success: true,
      message: 'Guest cart merged with user cart',
      cart: {
        id: userCart.id,
        items: updatedItems.map(item => ({
          ...item.toJSON(),
          productData: item.productData || {}
        })),
        totalQuantity,
        totalAmount
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error associating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};