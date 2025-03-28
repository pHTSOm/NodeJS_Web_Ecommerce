// productController.js
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// Configure upload settings
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
}).single('productImage');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    console.log("Getting product by ID:", req.params.id);
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        category: req.params.category
      }
    });
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  // console.log("CREATE PRODUCT REQUEST RECEIVED");
  // console.log("Headers:", req.headers);
  // console.log("Body before multer:", req.body);
  
  // Use multer middleware for file upload
  upload(req, res, async function(err) {
    // console.log("INSIDE UPLOAD CALLBACK");
    // console.log("Body after multer:", req.body);
    // console.log("File:", req.file);
    
    if (err instanceof multer.MulterError) {
      console.error("MULTER ERROR:", err);
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.error("OTHER UPLOAD ERROR:", err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      // File was uploaded successfully, now create product in database
      const { productName, shortDesc, description, category, price } = req.body;
      
      // Get the image URL or path
      const imgUrl = req.file ? `/uploads/products/${req.file.filename}` : null;
      
      // Create product in database
      const product = await Product.create({
        productName,
        shortDesc,
        description,
        category,
        price,
        imgUrl
      });
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });
};

// Update product
exports.updateProduct = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Update product fields
      const { productName, shortDesc, description, category, price } = req.body;
      
      // Only update imgUrl if a new file was uploaded
      let imgUrl = product.imgUrl;
      if (req.file) {
        // Delete old image if exists
        if (product.imgUrl) {
          const oldImagePath = path.join('public', product.imgUrl);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        imgUrl = `/uploads/products/${req.file.filename}`;
      }
      
      // Update product
      await product.update({
        productName: productName || product.productName,
        shortDesc: shortDesc || product.shortDesc,
        description: description || product.description,
        category: category || product.category,
        price: price || product.price,
        imgUrl
      });
      
      res.json({
        success: true,
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Delete product image if exists
    if (product.imgUrl) {
      const imagePath = path.join('public', product.imgUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete product from database
    await product.destroy();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};