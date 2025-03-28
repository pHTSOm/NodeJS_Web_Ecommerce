import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { toast } from "react-toastify";
import { ProductService } from "../services/api";
import { useNavigate, useParams } from "react-router-dom";

function AddProduct() {
  const [enterTitle, setEnterTitle] = useState("");
  const [enterShortDesc, setEnterShortDesc] = useState("");
  const [enterDescription, setEnterDescription] = useState("");
  const [enterCategory, setEnterCategory] = useState("");
  const [enterPrice, setEnterPrice] = useState("");
  const [enterProductImg, setEnterProductImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  
  // Check if we're in edit mode
  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchProductDetails();
    }
  }, [id]);
  
  // Fetch product details if in edit mode
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProductById(id);
      const product = response.product;
      
      setEnterTitle(product.productName);
      setEnterShortDesc(product.shortDesc);
      setEnterDescription(product.description);
      setEnterCategory(product.category);
      setEnterPrice(product.price);
      // Note: We don't set image as it's a file input
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to load product details");
      navigate("/admin/products");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!enterTitle || !enterShortDesc || !enterDescription || !enterCategory || !enterPrice) {
        toast.error("Please fill all fields!");
        setLoading(false);
        return;
      }
      
      if (!isEdit && !enterProductImg) {
        toast.error("Please select a product image!");
        setLoading(false);
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("productName", enterTitle);
      formData.append("shortDesc", enterShortDesc);
      formData.append("description", enterDescription);
      formData.append("category", enterCategory);
      formData.append("price", enterPrice);
      
      // Only append image if it's selected
      if (enterProductImg) {
        formData.append("productImage", enterProductImg);
      }
      
      if (isEdit) {
        // Update existing product
        await ProductService.updateProduct(id, formData);
        toast.success("Product updated successfully!");
      } else {
        // Create new product
        await ProductService.createProduct(formData);
        toast.success("Product added successfully!");
        
        // Reset form after successful creation
        setEnterTitle("");
        setEnterShortDesc("");
        setEnterDescription("");
        setEnterCategory("");
        setEnterPrice("");
        setEnterProductImg(null);
      }
      
      setLoading(false);
      
      // Navigate to products list after a short delay
      setTimeout(() => {
        navigate("/admin/products");
      }, 1500);
      
    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
      toast.error(isEdit ? "Failed to update product" : "Failed to add product");
    }
  };

  return (
    <section>
      <Container>
        <Row>
          <Col lg="12">
            {loading ? (
              <h4 className="py-5">Loading.....</h4>
            ) : (
              <>
                <h4 className="mb-5">{isEdit ? "Edit Product" : "Add Product"}</h4>
                <Form onSubmit={handleSubmit}>
                  <FormGroup className="form__group">
                    <span>Product title</span>
                    <input
                      type="text"
                      placeholder="Product name"
                      value={enterTitle}
                      onChange={(e) => setEnterTitle(e.target.value)}
                      required
                    />
                  </FormGroup>

                  <FormGroup className="form__group">
                    <span>Short Description</span>
                    <input
                      type="text"
                      placeholder="Short description..."
                      value={enterShortDesc}
                      onChange={(e) => setEnterShortDesc(e.target.value)}
                      required
                    />
                  </FormGroup>

                  <FormGroup className="form__group">
                    <span>Description</span>
                    <input
                      type="text"
                      placeholder="Detailed description..."
                      value={enterDescription}
                      onChange={(e) => setEnterDescription(e.target.value)}
                      required
                    />
                  </FormGroup>

                  <div className="d-flex align-items-center justify-content-between gap-5">
                    <FormGroup className="form__group w-50">
                      <span>Price</span>
                      <input
                        type="number"
                        placeholder="$100"
                        value={enterPrice}
                        onChange={(e) => setEnterPrice(e.target.value)}
                        required
                      />
                    </FormGroup>

                    <FormGroup className="form__group w-50">
                      <span>Category</span>
                      <select
                        className="w-100 p-2"
                        value={enterCategory}
                        onChange={(e) => setEnterCategory(e.target.value)}
                        required
                      >
                        <option value="">Select category</option>
                        <option value="game">Game</option>
                        <option value="console">Console</option>
                        <option value="mobile">Mobile</option>
                        <option value="watch">Watch</option>
                        <option value="wireless">Wireless</option>
                      </select>
                    </FormGroup>
                  </div>

                  <div>
                    <FormGroup className="form__group">
                      <span>Product Image {isEdit && "(Leave empty to keep current image)"}</span>
                      <input
                        type="file"
                        onChange={(e) => setEnterProductImg(e.target.files[0])}
                        required={!isEdit} // Only required for new products
                      />
                    </FormGroup>
                  </div>

                  <button className="buy__btn btn" type="submit" disabled={loading}>
                    {loading ? "Processing..." : (isEdit ? "Update Product" : "Add Product")}
                  </button>
                </Form>
              </>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default AddProduct;