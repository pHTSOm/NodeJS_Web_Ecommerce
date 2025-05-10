import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button, Spinner, Badge, Pagination, PaginationItem, PaginationLink } from "reactstrap";
import { Link } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { OrderService } from "../services/api";
import { toast } from "react-toastify";
import '../styles/profile.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      
      console.log("Fetching orders, page:", page);
      
      // Direct fetch approach for better debugging
      const response = await fetch(`/api/orders?page=${page}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      console.log("Orders API response:", data);
      
      if (data.success) {
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.message || "Failed to load orders");
        console.error("API returned error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching orders (detailed):", {
        message: error.message,
        stack: error.stack
      });
      setError("An error occurred while fetching your orders");
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  // Helper for status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Helmet title="Order History">
      <CommonSection title="Your Orders" />
      <section>
        <Container>
          <Row>
            <Col lg="12">
              <div className="mb-4">
                <h3>Order History</h3>
                <p>View and track all your previous orders.</p>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                  <p className="mt-3">Loading your orders...</p>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <div className="text-danger mb-3">
                    <i className="ri-error-warning-line" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h4>{error}</h4>
                  <Button color="primary" className="mt-3" onClick={() => fetchOrders(currentPage)}>
                    Retry
                  </Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="ri-shopping-basket-line" style={{ fontSize: '3rem', color: '#aaa' }}></i>
                  </div>
                  <h4>No Orders Found</h4>
                  <p>You haven't placed any orders yet.</p>
                  <Button tag={Link} to="/shop" color="primary" className="mt-3">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover bordered className="order-history-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Items</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <Link to={`/orders/${order.id}`} className="fw-bold text-primary">
                                #{order.id}
                              </Link>
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>
                              <Badge color={getStatusBadgeColor(order.currentStatus)}>
                                {order.currentStatus}
                              </Badge>
                            </td>
                            <td>${parseFloat(order.totalAmount).toFixed(2)}</td>
                            <td>
                              {order.OrderItems ? order.OrderItems.length : '—'}
                            </td>
                            <td>
                              <Button
                                tag={Link}
                                to={`/orders/${order.id}`}
                                color="primary"
                                size="sm"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <PaginationItem disabled={currentPage === 1}>
                          <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
                        </PaginationItem>
                        
                        {[...Array(totalPages).keys()].map(page => (
                          <PaginationItem key={page + 1} active={currentPage === page + 1}>
                            <PaginationLink onClick={() => handlePageChange(page + 1)}>
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem disabled={currentPage === totalPages}>
                          <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
                        </PaginationItem>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default OrderHistory;