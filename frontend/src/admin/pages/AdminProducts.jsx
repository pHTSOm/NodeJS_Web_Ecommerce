import React, { useState, useEffect } from "react";
import { Row, Col, Table, Button, Input, Spinner, Card, CardBody, CardHeader } from "reactstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { getImageUrl } from '../../utils/imageUtils';
import { ProductService } from "../../services/api";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product => 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getAllProducts({ limit: 1000 }); // Get all products
      setProducts(response.products || []);
      setFilteredProducts(response.products || []);
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
  
  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="admin-products">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Product Management</h2>
        <div>
          <Button color="primary" tag={Link} to="/admin/products/add">
            <i className="ri-add-line me-2"></i> Add New Product
          </Button>
        </div>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Products</h5>
            <div className="search-box" style={{ width: '300px' }}>
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : (
            <div className="table-responsive">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No products found</h5>
                  <p>Start by adding some products to your store</p>
                </div>
              ) : (
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
                    {filteredProducts.map((product) => {
                      // Process image URL
                      const imageUrl = getImageUrl(product.imgUrl);
                      
                      return (
                        <tr key={product.id}>
                          <td className="product-image">
                            <img
                              src={imageUrl}
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
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminProducts;