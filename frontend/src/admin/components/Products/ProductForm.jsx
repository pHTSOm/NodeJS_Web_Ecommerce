import React, { useState, useEffect } from "react";
import { Form, FormGroup, Input, Label, Button, Spinner } from "reactstrap";
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
    productImages: [],
    isNew: false,
    isBestSeller: false,
    brand: "",
    tags: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  // If editing an existing product, populate the form
  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || "",
        shortDesc: product.shortDesc || "",
        description: product.description || "",
        category: product.category || "",
        price: product.price || "",
        productImages: [], // Initialize as empty array, files won't be pre-filled
        isNew: product.isNew || false,
        isBestSeller: product.isBestSeller || false,
        brand: product.brand || "",
        tags: product.tags || "",
      });

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
      if (name === "productImages" && files) {
        const selectedFiles = Array.from(files);
        setFormData({ ...formData, productImages: selectedFiles });
        
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.productName || !formData.category || !formData.price) {
      toast.error("Please fill all required fields!");
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
    
    // Add images if any were selected
    if (formData.productImages && formData.productImages.length > 0) {
      formData.productImages.forEach(file => {
        submitData.append("productImage", file);
      });
    }
    
    // Debug log what we're sending
    console.log("Form data being submitted:");
    for (let [key, value] of submitData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
    }
    
    // Submit the form
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
                <Label for="price">Price*</Label>
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
            <Label for="productImages">Product Images</Label>
            <Input
              type="file"
              name="productImages"
              id="productImages"
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

            {product && formData.productImages && formData.productImages.length === 0 && (
              <small className="text-muted">
                Leave empty to keep current images
              </small>
            )}
          </FormGroup>
        </div>
      </div>

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
