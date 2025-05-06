const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const upload = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    console.log("GET /products request received");
    console.log("Query params:", req.query);
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Filtering
    const whereClause = {};

    // Category filter
    if (req.query.category) {
      whereClause.category = req.query.category;
    }

    // Brand filter
    if (req.query.brand) {
      whereClause.brand = req.query.brand;
    }

    // Price range filter
    if (req.query.minPrice && req.query.maxPrice) {
      whereClause.price = {
        [Op.gte]: parseFloat(req.query.minPrice),
        [Op.lte]: parseFloat(req.query.maxPrice)
      };
    } else if (req.query.minPrice) {
      whereClause.price = {
        [Op.gte]: parseFloat(req.query.minPrice)
      };
    } else if (req.query.maxPrice) {
      whereClause.price = {
        [Op.lte]: parseFloat(req.query.maxPrice)
      };
    }

    // Search by name
    if (req.query.search) {
      whereClause.productName = {
        [Op.like]: `%${req.query.search}%`
      };
    }

    // New or bestseller filters
    if (req.query.isNew === 'true') {
      whereClause.isNew = true;
    }

    if (req.query.isBestSeller === 'true') {
      whereClause.isBestSeller = true;
    }

    // Sorting
    let order = [['createdAt', 'DESC']];
    
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          order = [['price', 'ASC']];
          break;
        case 'price_desc':
          order = [['price', 'DESC']];
          break;
        case 'name_asc':
          order = [['productName', 'ASC']];
          break;
        case 'name_desc':
          order = [['productName', 'DESC']];
          break;
      }
    }

    // Fetch products with count
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order,
      limit,
      offset,
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'additionalPrice', 'stock']
        }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      products,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
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
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'description', 'additionalPrice', 'stock', 'sku']
        }
      ]
    });

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
    // Pagination 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Sorting
    let order = [['createdAt', 'DESC']];

    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          order = [['price', 'ASC']];
          break;
        case 'price_desc':
          order = [['price', 'DESC']];
          break;
        case 'name_asc':
          order = [['productName', 'ASC']];
          break;
        case 'name_desc':
          order = [['productName', 'DESC']];
          break;
      }
    }

    // Fetch products with count
    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        category: req.params.category
      },
      order,
      limit,
      offset,
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'additionalPrice', 'stock']
        }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      products,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
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
  // Use multer middleware for file upload
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      // File was uploaded successfully, now create product in database
      const { productName, shortDesc, description, category, price, brand, stock, isNew, isBestSeller, tags } = req.body;
      
      // Get the image URL or path
      const imgUrl = req.file ? `/uploads/products/${req.file.filename}` : null;
      
      // Create product in database
      const product = await Product.create({
        productName,
        shortDesc,
        description,
        category,
        price,
        brand,
        stock: stock || 0,
        imgUrl: JSON.stringify([imgUrl]),
        isNew: isNew === 'true',
        isBestSeller: isBestSeller === 'true',
        tags
      });
      
      // Handle variants if provided
      if (req.body.variants && typeof req.body.variants === 'string') {
        try {
          const variants = JSON.parse(req.body.variants);
          if (Array.isArray(variants)) {
            for (const variant of variants) {
              await ProductVariant.create({
                productId: product.id,
                name: variant.name,
                description: variant.description || variant.name,
                additionalPrice: variant.additionalPrice || 0,
                stock: variant.stock || 0,
                sku: variant.sku || `${product.id}-${variant.name}`
              });
            }
          }
        } catch (parseError) {
          console.error('Error parsing variants:', parseError);
        }
      }

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
      const { productName, shortDesc, description, category, price, brand, stock, isNew, isBestSeller, tags } = req.body;
      
      // Only update imgUrl if a new file was uploaded
      let imgUrl = product.imgUrl;
      if (req.file) {
        // Handle the case where imgUrl is a JSON string
        let images = [];
        try {
          images = JSON.parse(product.imgUrl);
        } catch (e) {
          // If it's not a valid JSON, treat it as a single string
          images = product.imgUrl ? [product.imgUrl] : [];
        }
        
        // Add the new image
        const newImagePath = `/uploads/products/${req.file.filename}`;
        images.push(newImagePath);
        
        // Save as JSON string
        imgUrl = JSON.stringify(images);
      }
      
      // Update product
      await product.update({
        productName: productName || product.productName,
        shortDesc: shortDesc || product.shortDesc,
        description: description || product.description,
        category: category || product.category,
        price: price || product.price,
        brand: brand || product.brand,
        stock: stock || product.stock,
        imgUrl,
        isNew: isNew !== undefined ? isNew === 'true' : product.isNew,
        isBestSeller: isBestSeller !== undefined ? isBestSeller === 'true' : product.isBestSeller,
        tags: tags || product.tags
      });
      
      // Handle variants if provided
      if (req.body.variants && typeof req.body.variants === 'string') {
        try {
          const variants = JSON.parse(req.body.variants);
          if (Array.isArray(variants)) {
            // Process each variant
            for (const variant of variants) {
              if (variant.id) {
                // Update existing variant
                await ProductVariant.update(
                  {
                    name: variant.name,
                    description: variant.description || variant.name,
                    additionalPrice: variant.additionalPrice || 0,
                    stock: variant.stock || 0,
                    sku: variant.sku || `${product.id}-${variant.name}`
                  },
                  {
                    where: { id: variant.id, productId: product.id }
                  }
                );
              } else {
                // Create new variant
                await ProductVariant.create({
                  productId: product.id,
                  name: variant.name,
                  description: variant.description || variant.name,
                  additionalPrice: variant.additionalPrice || 0,
                  stock: variant.stock || 0,
                  sku: variant.sku || `${product.id}-${variant.name}`
                });
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing variants:', parseError);
        }
      }

      // Fetch updated product with variants
      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: ProductVariant,
            attributes: ['id', 'name', 'additionalPrice', 'stock', 'sku']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
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
      try {
        let images = [];
        if (typeof product.imgUrl === 'string') {
          if (product.imgUrl.startsWith('[')) {
            images = JSON.parse(product.imgUrl);
          } else {
            images = [product.imgUrl];
          }
        } else if (Array.isArray(product.imgUrl)) {
          images = product.imgUrl;
        }
        
        // Delete each image
        for (const img of images) {
          const imagePath = path.join(__dirname, '../public', img);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      } catch (error) {
        console.error('Error deleting product images:', error);
      }
    }

    // Delete product from database (cascades to variants and reviews)
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

// Get available brands
exports.getBrands = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const brands = await Product.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']],
      order: [['brand', 'ASC']]
    });
    
    res.json({
      success: true,
      brands: brands.map(item => item.brand)
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};