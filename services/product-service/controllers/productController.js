const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const upload = require("../utils/fileUpload");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");

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
        [Op.lte]: parseFloat(req.query.maxPrice),
      };
    } else if (req.query.minPrice) {
      whereClause.price = {
        [Op.gte]: parseFloat(req.query.minPrice),
      };
    } else if (req.query.maxPrice) {
      whereClause.price = {
        [Op.lte]: parseFloat(req.query.maxPrice),
      };
    }

    // Search by name
    if (req.query.search) {
      whereClause.productName = {
        [Op.like]: `%${req.query.search}%`,
      };
    }

    // New or bestseller filters
    if (req.query.isNew === "true") {
      whereClause.isNew = true;
    }

    if (req.query.isBestSeller === "true") {
      whereClause.isBestSeller = true;
    }

    // Sorting
    let order = [["createdAt", "DESC"]];

    if (req.query.sort) {
      switch (req.query.sort) {
        case "price_asc":
          order = [["price", "ASC"]];
          break;
        case "price_desc":
          order = [["price", "DESC"]];
          break;
        case "name_asc":
          order = [["productName", "ASC"]];
          break;
        case "name_desc":
          order = [["productName", "DESC"]];
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
          attributes: ["id", "name", "additionalPrice", "stock"],
        },
      ],
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
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    console.log(
      `GET product by ID: ${req.params.id} (type: ${typeof req.params.id})`
    );

    // Convert ID to number if it's a string
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductVariant,
          attributes: [
            "id",
            "name",
            "description",
            "additionalPrice",
            "stock",
            "sku",
          ],
        },
      ],
    });

    if (!product) {
      console.log(`Product with ID ${productId} not found`);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log(`Found product: ${product.productName}`);
    console.log("Product imgUrl:", product.imgUrl);

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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
    let order = [["createdAt", "DESC"]];

    if (req.query.sort) {
      switch (req.query.sort) {
        case "price_asc":
          order = [["price", "ASC"]];
          break;
        case "price_desc":
          order = [["price", "DESC"]];
          break;
        case "name_asc":
          order = [["productName", "ASC"]];
          break;
        case "name_desc":
          order = [["productName", "DESC"]];
          break;
      }
    }

    // Fetch products with count
    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        category: req.params.category,
      },
      order,
      limit,
      offset,
      include: [
        {
          model: ProductVariant,
          attributes: ["id", "name", "additionalPrice", "stock"],
        },
      ],
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
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting products by category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  // Use multer middleware for file upload
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      console.log("Create product request received");
      console.log("Request body:", req.body);
      console.log("Files:", req.files || req.file || "No files uploaded");

      // File was uploaded successfully, now create product in database
      const {
        productName,
        shortDesc,
        description,
        category,
        price,
        brand,
        stock,
        isNew,
        isBestSeller,
        tags,
      } = req.body;

      // Get image URLs
      let imgUrls = [];

      // Handle multiple files (if using multer .array())
      if (req.files && req.files.length > 0) {
        imgUrls = req.files.map((file) => `/products/${file.filename}`);
        console.log("Multiple files processed:", imgUrls);
      }
      // Handle single file (if using multer .single())
      else if (req.file) {
        imgUrls.push(`/products/${req.file.filename}`);
        console.log("Single file processed:", imgUrls);
      }

      // Create product in database
      const product = await Product.create({
        productName,
        shortDesc,
        description,
        category,
        price,
        brand,
        stock: stock || 0,
        imgUrl: JSON.stringify(imgUrls.length > 0 ? imgUrls : [null]),
        isNew: isNew === "true",
        isBestSeller: isBestSeller === "true",
        tags,
      });

      console.log("Product created:", product.id);

      // Handle variants if provided
      if (req.body.variants && typeof req.body.variants === "string") {
        try {
          const variants = JSON.parse(req.body.variants);
          console.log("Processing variants:", variants);

          if (Array.isArray(variants)) {
            for (const variant of variants) {
              try {
                const newVariant = await ProductVariant.create({
                  productId: product.id,
                  name: variant.name,
                  description: variant.description || variant.name,
                  additionalPrice: variant.additionalPrice || 0,
                  stock: variant.stock || 0,
                  sku: variant.sku || `${product.id}-${variant.name}`,
                });
                console.log("Created variant:", newVariant.id, variant.name);
              } catch (variantError) {
                console.error(
                  "Failed to create variant:",
                  variant.name,
                  variantError
                );
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing variants:", parseError);
        }
      }

      // Fetch the complete product with variants to return
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: ProductVariant,
            attributes: [
              "id",
              "name",
              "description",
              "additionalPrice",
              "stock",
              "sku",
            ],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: createdProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  });
};

// Update product
exports.updateProduct = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Update product fields
      const {
        productName,
        shortDesc,
        description,
        category,
        price,
        brand,
        stock,
        isNew,
        isBestSeller,
        tags,
      } = req.body;

      // Only update imgUrl if a new file was uploaded
      let imgUrl = product.imgUrl;
      if (
        req.files &&
        req.files.productImage &&
        req.files.productImage.length > 0
      ) {
        // Handle the case where imgUrl is a JSON string
        let images = [];
        try {
          images = JSON.parse(product.imgUrl);
        } catch (e) {
          // If it's not a valid JSON, treat it as a single string
          images = product.imgUrl ? [product.imgUrl] : [];
        }

        // Add the new images
        req.files.productImage.forEach((file) => {
          images.push(`/uploads/products/${file.filename}`);
        });

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
        isNew: isNew !== undefined ? isNew === "true" : product.isNew,
        isBestSeller:
          isBestSeller !== undefined
            ? isBestSeller === "true"
            : product.isBestSeller,
        tags: tags || product.tags,
      });

      // Handle variants if provided
      if (req.body.variants && typeof req.body.variants === "string") {
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
                    sku: variant.sku || `${product.id}-${variant.name}`,
                  },
                  {
                    where: { id: variant.id, productId: product.id },
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
                  sku: variant.sku || `${product.id}-${variant.name}`,
                });
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing variants:", parseError);
        }
      }

      // Fetch updated product with variants
      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: ProductVariant,
            attributes: ["id", "name", "additionalPrice", "stock", "sku"],
          },
        ],
      });

      res.json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    console.log(`Attempting to delete product with ID: ${req.params.id}`);

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete product image if exists
    if (product.imgUrl) {
      console.log("Found imgUrl to delete:", product.imgUrl);
      try {
        let images = [];
        if (typeof product.imgUrl === "string") {
          if (product.imgUrl.startsWith("[")) {
            try {
              images = JSON.parse(product.imgUrl);
              console.log("Parsed JSON image array:", images);
            } catch (jsonError) {
              console.error("Error parsing imgUrl JSON:", jsonError);
              images = [product.imgUrl];
            }
          } else {
            images = [product.imgUrl];
          }
        } else if (Array.isArray(product.imgUrl)) {
          images = product.imgUrl;
        }

        // Delete each image
        for (const img of images) {
          try {
            if (!img) continue; // Skip null or empty values

            const imagePath = path.join(__dirname, "../public", img);
            console.log("Attempting to delete image at path:", imagePath);

            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log("Successfully deleted image at path:", imagePath);
            } else {
              console.log("Image path does not exist:", imagePath);
            }
          } catch (imgError) {
            console.error(`Error deleting image ${img}:`, imgError);
            // Continue with other images even if one fails
          }
        }
      } catch (imageError) {
        console.error("Error processing product images:", imageError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Explicitly delete associated variants first
    try {
      console.log("Deleting product variants...");
      await ProductVariant.destroy({
        where: { productId: product.id },
      });
      console.log("Successfully deleted variants");
    } catch (variantError) {
      console.error("Error deleting product variants:", variantError);
      // Continue with product deletion
    }

    // Now delete the product
    console.log("Deleting the product...");
    await product.destroy();
    console.log("Product successfully deleted");

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get available brands
exports.getBrands = async (req, res) => {
  try {
    const { sequelize } = require("../config/db");
    const brands = await Product.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("brand")), "brand"]],
      order: [["brand", "ASC"]],
    });

    res.json({
      success: true,
      brands: brands.map((item) => item.brand),
    });
  } catch (error) {
    console.error("Error getting brands:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
