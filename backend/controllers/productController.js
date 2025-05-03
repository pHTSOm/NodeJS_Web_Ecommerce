// productController.js
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Review = require('../models/Review');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op } = require('sequelize');

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
      whereClause.price = {};
      if (req.query.minPrice) {
        whereClause.price[Op.gte] = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        whereClause.price[Op.lte] = parseFloat(req.query.maxPrice);
      }
    }

    // Search by name
    if (req.query.search) {
      whereClause.productName = {
        [Op.like]: `%${req.query.search}%`
      }
    }

    // New or bestseller filters
    if ( req.query.isNew === 'true' ) {
      whereClause.isNew = true;
    }

    if ( req.query.isBestseller === 'true' ) {
      whereClause.isBestseller = true;
    }

    // Sorting
    let order = [['createdAt', 'DESC']];
    
    if (req.query.sort){
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
        case 'rating':
          order = [['avgRating', 'DESC']];
          break;
        case 'newest':
          order = [['createdAt', 'DESC']];
          break;
        case 'bestselling':
          order = [['salesCount', 'DESC']];
          break;
      }
    }

    // Fetch products with count
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order,
      limit,
      offset,
      include:[
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
      pagination:{
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
    console.log("Getting product by ID:", req.params.id);
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'additionalPrice', 'stock', 'sku']
        },
        {
          model: Review,
          attributes: ['id', 'userName', 'rating', 'comment', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
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
    console.log('----- getProductsByCategory -----');
    console.log('Category:', req.params.category);
    console.log('Query parameters:', req.query);

    console.log(`Fetching products for category: ${req.params.category}`);
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

// Get product by ID
exports.getProductById = async (req, res) => {
  try{
    console.log("Getting product by ID:", req.params.id);
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'description', 'additionalPrice', 'stock', 'sku']
        },
        {
          model: Review,
          attributes: ['id', 'userName', 'rating', 'comment', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product){
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    })
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}
// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try{
    //Pagination 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Sorting
    let order = [['createdAt', 'DESC']];

    if (req.query.sort){
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
    const { count, rows: products} = await Product.findAndCountAll({
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
    })

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      products,
      pagination:{
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
}

// Get new products
exports.getNewProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isNew: true
      },
      limit: 8,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'additionalPrice', 'stock']
        }
      ]
    });
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting new products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// Get best seller products
exports.getBestSellerProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isBestSeller: true
      },
      limit: 8,
      order: [['salesCount', 'DESC']],
      include: [
        {
          model: ProductVariant,
          attributes: ['id', 'name', 'additionalPrice', 'stock']
        }
      ]
    });
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting best seller products:', error);
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

// Create a new product
exports.createProduct = async (req, res) => {  
  // Use multer middleware for file upload
  upload(req, res, async function(err) {
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
        imgUrl,
        isNew: isNew === 'true',
        isBestSeller: isBestSeller === 'true',
        tags
      });
      
      // Handle variants if provided
      if (req.body.variants && typeof req.body.variants === 'string') {
        try{
          const variants = JSON.parse(req.body.variants);
          if(Array.isArray(variants)) {
            for (const variant of variants) {
              await ProductVariant.create({
                productId: product.id,
                name: variant.name,
                description: variant.description,
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
        // Delete old image if exists
        if (product.imgUrl) {
          const oldImagePath = path.join(__dirname, '../public', product.imgUrl);
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
        brand: brand || product.brand,
        stock: stock || product.stock,
        imgUrl,
        isNew: isNew !== undefined ? isNew === 'true' : product.isNew,
        isBestSeller: isBestSeller !== undefined ? isBestSeller === 'true' : product.isBestSeller,
        tags: tags || product.tags
      });
      
      // Handle variants if provided
      if (req.body.variants && typeof req.body.variants === 'string') {
        try{
          const variants = JSON.parse(req.body.variants);
          if(Array.isArray(variants)) {
            // Get current variants
            const currentVariants = await ProductVariant.findAll({
              where: { productId: product.id }
            });
            
            // Delete variants that are not in the new list
            const newVariantIds = variants
            .filter(v => v.id)
            .map(v => parseInt(v.id));

            for (const currentVariant of currentVariants) {
              if(!newVariantIds.includes(currentVariants.id)) {
                await currentVariant.destroy();
              }
            }

            // Update or create new variants
            for (const variant  of variants) {
              if (variant.id) {
                // Update existing variant
                await ProductVariant.update({
                  name: variant.name,
                  description: variant.description,
                  additionalPrice: variant.additionalPrice || 0,
                  stock: variant.stock || 0,
                  sku: variant.sku || `${product.id}-${variant.name}`
                }, {
                  where: { 
                    id: variant.id,
                    productId: product.id 
                  }
                });
              }else{
                // Create new variant
                await ProductVariant.create({
                  productId: product.id,
                  name: variant.name,
                  description: variant.description,
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
      const imagePath = path.join(__dirname, 'public', product.imgUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete associated variants
    await ProductVariant.destroy({
      where: { productId: product.id }
    })

    // Delete associated reviews
    await Review.destroy({
      where: { productId: product.id }
    });

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