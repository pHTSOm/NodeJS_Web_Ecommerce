// src/pages/AdminProducts.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button } from "reactstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ProductService } from "../services/api";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import "../styles/admin-products.css";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getAllProducts();
      setProducts(response.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this product?");
      if (!confirmed) return;
      
      await ProductService.deleteProduct(id);
      toast.success("Product deleted successfully");
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  // Format price to display with 2 decimal places
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  // Truncate long text for table display
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <Helmet title="Manage Products">
      <CommonSection title="Manage Products" />
      <section>
        <Container>
          <Row className="mb-4">
            <Col lg="6">
              <h4>Product Management</h4>
            </Col>
            <Col lg="6" className="text-end">
              <Button color="primary" tag={Link} to="/addproduct">
                Add New Product
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <h5 className="fw-bold">Loading...</h5>
            </div>
          ) : (
            <Row>
              <Col lg="12">
                {products.length === 0 ? (
                  <div className="text-center py-5">
                    <h5>No products found</h5>
                    <p>Start by adding some products to your store</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table bordered hover className="admin-products-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="product-image">
                              <img
                                src={product.imgUrl ? 
                                  (product.imgUrl.startsWith('http') ? product.imgUrl : `http://localhost:5000${product.imgUrl}`) 
                                  : '/placeholder.png'
                                }
                                alt={product.productName}
                                onError={(e) => { e.target.src = '/placeholder.png'; }}
                              />
                            </td>
                            <td>{product.productName}</td>
                            <td>{product.category}</td>
                            <td>${formatPrice(product.price)}</td>
                            <td>{truncateText(product.description)}</td>
                            <td className="actions">
                              <motion.span
                                whileTap={{ scale: 1.1 }}
                                className="edit-btn"
                              >
                                <Link to={`/admin/products/edit/${product.id}`}>
                                  <i className="ri-edit-line"></i>
                                </Link>
                              </motion.span>
                              <motion.span
                                whileTap={{ scale: 1.1 }}
                                className="delete-btn"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </motion.span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Container>
      </section>
    </Helmet>
  );
};

export default AdminProducts;