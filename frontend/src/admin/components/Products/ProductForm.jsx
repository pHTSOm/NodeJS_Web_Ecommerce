import React, { useState, useEffect } from "react";
import { 
  Form, FormGroup, Input, Label, Button, Spinner, 
  Table, Row, Col, Card, CardBody, CardHeader, Badge
} from "reactstrap";
import { toast } from "react-toastify";

const ProductForm = ({
  product = null,
  onSubmit,
  loading = false,
  categories = ["CPU", "GPU", "Storage", "Memory", "Motherboard", "Laptop"],
}) => {
  const [formData, setFormData] = useState({
    productName: "",
    shortDesc: "",
    description: "",
    category: "",
    price: "",
    productImage: [],
    isNew: false,
    isBestSeller: false,
    brand: "",
    tags: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  
  // New state for variants
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    name: "",
    description: "",
    additionalPrice: 0,
    stock: 0
  });

  // If editing an existing product, populate the form
  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || "",
        shortDesc: product.shortDesc || "",
        description: product.description || "",
        category: product.category || "",
        price: product.price || "",
        productImage: [], // Initialize as empty array, files won't be pre-filled
        isNew: product.isNew || false,
        isBestSeller: product.isBestSeller || false,
        brand: product.brand || "",
        tags: product.tags || "",
      });

      // Load product variants if they exist
      if (product.ProductVariants && product.ProductVariants.length > 0) {
        setVariants(product.ProductVariants.map(variant => ({
          id: variant.id,
          name: variant.name,
          description: variant.description,
          additionalPrice: variant.additionalPrice,
          stock: variant.stock
        })));
      }

      // Process product images for preview
      if (product.imgUrl) {
        try {
          let images = [];
          
          // Parse imgUrl which could be JSON string, array, or single string
          if (typeof product.imgUrl === "string") {
            if (product.imgUrl.startsWith("[")) {
              // Parse JSON array
              try {
                const parsedImages = JSON.parse(product.imgUrl);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  images = parsedImages;
                }
              } catch (e) {
                console.error("Failed to parse imgUrl JSON:", e);
                images = [product.imgUrl];
              }
            } else {
              // Single image URL
              images = [product.imgUrl];
            }
          } else if (Array.isArray(product.imgUrl)) {
            // Already an array
            images = product.imgUrl;
          }
          
          // Process each image URL for preview
          const previews = images.map(imageUrl => {
            if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith("http")) {
              // Format local URLs
              if (imageUrl.startsWith("/uploads/")) {
                return imageUrl;
              } else {
                return `/uploads/products/${imageUrl}`;
              }
            }
            return imageUrl || '';
          }).filter(url => url); // Filter out empty urls
          
          // Set image previews (always as array)
          setImagePreviews(previews);
          
        } catch (error) {
          console.error("Error processing product images:", error);
          setImagePreviews([]);
        }
      }
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      // Handle file input
      if (name === "productImage" && files) {
        const selectedFiles = Array.from(files);
        setFormData({ ...formData, productImage: selectedFiles });
        
        // Generate new previews
        setImagePreviews([]); // Clear old previews
        
        selectedFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreviews(prev => [...prev, reader.result]);
          };
          reader.readAsDataURL(file);
        });
      }
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle new variant input changes
  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setNewVariant({
      ...newVariant,
      [name]: name === 'additionalPrice' || name === 'stock' ? parseFloat(value) : value
    });
  };

  // Add new variant to array
  const addVariant = () => {
    if (!newVariant.name) {
      toast.error("Variant name is required");
      return;
    }
    
    setVariants([...variants, { ...newVariant, id: Date.now() }]);
    setNewVariant({
      name: "",
      description: "",
      additionalPrice: 0,
      stock: 0
    });
  };

  // Remove variant from array
  const removeVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  // Generate default variants based on category
  const generateDefaultVariants = () => {
    const category = formData.category;
    if (!category) {
      toast.error("Please select a category first");
      return;
    }

    let newVariants = [];
    
    switch (category) {
      case "CPU":
        newVariants = [
          {
            id: Date.now(),
            name: "Base Model",
            description: "Default configuration",
            additionalPrice: 0,
            stock: 20
          },
          {
            id: Date.now() + 1,
            name: "OC Edition",
            description: "Factory overclocked for better performance",
            additionalPrice: 49.99,
            stock: 15
          }
        ];
        break;
      case "GPU":
        newVariants = [
          {
            id: Date.now(),
            name: "Standard Edition",
            description: "Reference design",
            additionalPrice: 0,
            stock: 20
          },
          {
            id: Date.now() + 1,
            name: "OC Edition",
            description: "Overclocked with enhanced cooling",
            additionalPrice: 79.99,
            stock: 15
          },
          {
            id: Date.now() + 2,
            name: "Liquid Cooled",
            description: "Integrated AIO liquid cooling for maximum performance",
            additionalPrice: 149.99,
            stock: 10
          }
        ];
        break;
      case "Storage":
        newVariants = [
          {
            id: Date.now(),
            name: "1TB",
            description: "Standard 1TB capacity",
            additionalPrice: 0,
            stock: 30
          },
          {
            id: Date.now() + 1,
            name: "2TB",
            description: "Expanded 2TB capacity",
            additionalPrice: 100.0,
            stock: 20
          }
        ];
        break;
      case "Memory":
        newVariants = [
          {
            id: Date.now(),
            name: "32GB (2x16GB) 3200MHz",
            description: "Standard speed dual-channel kit",
            additionalPrice: 0,
            stock: 20
          },
          {
            id: Date.now() + 1,
            name: "32GB (2x16GB) 3600MHz",
            description: "High-speed dual-channel kit",
            additionalPrice: 29.99,
            stock: 30
          }
        ];
        break;
      case "Motherboard":
        newVariants = [
          {
            id: Date.now(),
            name: "Standard Edition",
            description: "Basic configuration with standard warranty",
            additionalPrice: 0,
            stock: 35
          },
          {
            id: Date.now() + 1,
            name: "Premium Bundle",
            description: "Includes premium accessories and extended warranty",
            additionalPrice: 39.99,
            stock: 15
          }
        ];
        break;
      case "Laptop":
        newVariants = [
          {
            id: Date.now(),
            name: "Core i5 / 8GB / 256GB",
            description: "Intel Core i5-1240P, 8GB LPDDR5, 256GB SSD, FHD+ Display",
            additionalPrice: 0,
            stock: 15
          },
          {
            id: Date.now() + 1,
            name: "Core i7 / 16GB / 512GB",
            description: "Intel Core i7-1260P, 16GB LPDDR5, 512GB SSD, FHD+ Display",
            additionalPrice: 400.0,
            stock: 10
          },
          {
            id: Date.now() + 2,
            name: "Core i7 / 32GB / 1TB",
            description: "Intel Core i7-1260P, 32GB LPDDR5, 1TB SSD, UHD+ Touch Display",
            additionalPrice: 800.0,
            stock: 5
          }
        ];
        break;
      default:
        newVariants = [
          {
            id: Date.now(),
            name: "Basic Edition",
            description: "Standard configuration",
            additionalPrice: 0,
            stock: 30
          },
          {
            id: Date.now() + 1,
            name: "Deluxe Edition",
            description: "Enhanced features and premium support",
            additionalPrice: 49.99,
            stock: 20
          }
        ];
    }
    
    setVariants(newVariants);
    toast.info(`Added default variants for ${category}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.productName || !formData.category || !formData.price) {
      toast.error("Please fill all required fields!");
      return;
    }
    
    // Validate at least one variant
    if (variants.length === 0) {
      toast.error("Please add at least one product variant!");
      return;
    }
    
    // Create FormData object for multipart form submission
    const submitData = new FormData();
    
    // Add all text fields explicitly
    submitData.append("productName", formData.productName);
    submitData.append("shortDesc", formData.shortDesc);
    submitData.append("description", formData.description);
    submitData.append("category", formData.category);
    submitData.append("price", formData.price);
    submitData.append("brand", formData.brand || "");
    submitData.append("tags", formData.tags || "");
    submitData.append("isNew", formData.isNew ? "true" : "false");
    submitData.append("isBestSeller", formData.isBestSeller ? "true" : "false");
    
    // Add variants as JSON
    submitData.append("variants", JSON.stringify(variants));
    
    // Add images if any were selected
    if (formData.productImage && formData.productImage.length > 0) {
      formData.productImage.forEach(file => {
        submitData.append("productImage", file);
      });
    }
    
    // Debug log what we're sending
    console.log("Form data being submitted:");
    console.log("Variants:", variants);
    
    // Submit the form
    console.log(Array.from(submitData.entries()))
    onSubmit(submitData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-8">
          <FormGroup>
            <Label for="productName">Product Name*</Label>
            <Input
              type="text"
              name="productName"
              id="productName"
              placeholder="Enter product name"
              value={formData.productName}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label for="shortDesc">Short Description*</Label>
            <Input
              type="text"
              name="shortDesc"
              id="shortDesc"
              placeholder="Brief description (displayed in listings)"
              value={formData.shortDesc}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label for="description">Full Description*</Label>
            <Input
              type="textarea"
              name="description"
              id="description"
              placeholder="Detailed product description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <div className="row">
            <div className="col-md-6">
              <FormGroup>
                <Label for="price">Base Price*</Label>
                <Input
                  type="number"
                  name="price"
                  id="price"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </div>

            <div className="col-md-6">
              <FormGroup>
                <Label for="brand">Brand*</Label>
                <Input
                  type="text"
                  name="brand"
                  id="brand"
                  placeholder="e.g. Samsung, Intel, Nvidia"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <FormGroup>
                <Label for="category">Category*</Label>
                <Input
                  type="select"
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </div>

            <div className="col-md-6">
              <FormGroup>
                <Label for="tags">Tags</Label>
                <Input
                  type="text"
                  name="tags"
                  id="tags"
                  placeholder="Comma-separated tags"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <FormGroup check className="mb-3">
                <Input
                  type="checkbox"
                  name="isNew"
                  id="isNew"
                  checked={formData.isNew}
                  onChange={handleChange}
                />
                <Label check for="isNew">
                  Mark as New Product
                </Label>
              </FormGroup>
            </div>

            <div className="col-md-6">
              <FormGroup check className="mb-3">
                <Input
                  type="checkbox"
                  name="isBestSeller"
                  id="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={handleChange}
                />
                <Label check for="isBestSeller">
                  Mark as Best Seller
                </Label>
              </FormGroup>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <FormGroup>
            <Label for="productImage">Product Images</Label>
            <Input
              type="file"
              name="productImage"
              id="productImage"
              accept="image/*"
              multiple
              onChange={handleChange}
              className="mb-3"
            />

            {/* Ensure we're checking for array existence and length safely */}
            {Array.isArray(imagePreviews) && imagePreviews.length > 0 && (
              <div className="image-previews mb-3 d-flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="img-thumbnail"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder.png'; 
                        console.log(`Error loading preview ${index}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {product && formData.productImage && formData.productImage.length === 0 && (
              <small className="text-muted">
                Leave empty to keep current images
              </small>
            )}
          </FormGroup>
        </div>
      </div>

      {/* Product Variants Section */}
      <Card className="mt-4 mb-4">
        <CardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Product Variants</h5>
          {formData.category && (
            <Button color="secondary" onClick={generateDefaultVariants} type="button">
              Generate Default Variants
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <p className="text-muted mb-3">
            Add variants of this product with different prices and inventory levels.
            Each product must have at least one variant.
          </p>
          
          {/* Current Variants Table */}
          {variants.length > 0 && (
            <div className="table-responsive mb-4">
              <Table bordered>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Additional Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id}>
                      <td>{variant.name}</td>
                      <td>{variant.description}</td>
                      <td>${parseFloat(variant.additionalPrice).toFixed(2)}</td>
                      <td>{variant.stock}</td>
                      <td>
                        <Button
                          color="danger"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          
          {/* Add New Variant Form */}
          <Row>
            <Col md="3">
              <FormGroup>
                <Label for="variantName">Variant Name*</Label>
                <Input
                  type="text"
                  name="name"
                  id="variantName"
                  value={newVariant.name}
                  onChange={handleVariantChange}
                  placeholder="e.g. 1TB Model"
                />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label for="variantDescription">Description</Label>
                <Input
                  type="text"
                  name="description"
                  id="variantDescription"
                  value={newVariant.description}
                  onChange={handleVariantChange}
                  placeholder="Brief description of this variant"
                />
              </FormGroup>
            </Col>
            <Col md="2">
              <FormGroup>
                <Label for="variantPrice">Additional Price</Label>
                <Input
                  type="number"
                  name="additionalPrice"
                  id="variantPrice"
                  value={newVariant.additionalPrice}
                  onChange={handleVariantChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </FormGroup>
            </Col>
            <Col md="2">
              <FormGroup>
                <Label for="variantStock">Stock</Label>
                <Input
                  type="number"
                  name="stock"
                  id="variantStock"
                  value={newVariant.stock}
                  onChange={handleVariantChange}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </FormGroup>
            </Col>
            <Col md="1" className="d-flex align-items-end">
              <Button color="primary" onClick={addVariant} type="button" className="mb-3">
                Add
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <div className="d-flex justify-content-end mt-4">
        <Button
          color="secondary"
          type="button"
          className="me-2"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button color="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" /> Processing...
            </>
          ) : product ? (
            "Update Product"
          ) : (
            "Add Product"
          )}
        </Button>
      </div>
    </Form>
  );
};

export default ProductForm;