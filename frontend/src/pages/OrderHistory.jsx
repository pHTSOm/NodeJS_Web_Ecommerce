import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { OrderService } from '../services/api';
import CommonSection from '../components/UI/CommonSection';
import Helmet from '../components/Helmet/Helmet';
import '../styles/profile.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching orders for page', page);
      const response = await OrderService.getUserOrders({ page });
      console.log('Order response raw:', response);
      
      let processedOrders = [];
      
      // Standardize response handling regardless of format
      if (response) {
        // Handle format: { success: true, orders: [...] }
        if (response.success === true && Array.isArray(response.orders)) {
          processedOrders = response.orders;
          
          // Set pagination info if available
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
          }
        } 
        // Handle format: { success: true, data: { orders: [...] } }
        else if (response.success === true && response.data && Array.isArray(response.data.orders)) {
          processedOrders = response.data.orders;
          
          // Set pagination info if available
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1);
          }
        } 
        // Handle direct array format
        else if (Array.isArray(response)) {
          processedOrders = response;
          setTotalPages(1); // No pagination info available
        }
        // Handle case where result might be nested in a 'results' property
        else if (response.results && Array.isArray(response.results)) {
          processedOrders = response.results;
          
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
          }
        }
        else {
          console.error("Unknown response format:", response);
          setError('Invalid response format');
          processedOrders = [];
        }
      } else {
        setError('No response received');
        processedOrders = [];
      }

      // IMPORTANT: Debug the orders data to find where status is stored
      if (processedOrders.length > 0) {
        const sampleOrder = processedOrders[0];
        console.log('Sample order data:', {
          id: sampleOrder.id,
          status: sampleOrder.status,
          state: sampleOrder.state, // Check alternative field names
          orderStatus: sampleOrder.orderStatus,
          currentStatus: sampleOrder.currentStatus,
          allKeys: Object.keys(sampleOrder),
        });
        
        // Add nested property check
        if (sampleOrder.orderDetails && sampleOrder.orderDetails.status) {
          console.log('Status found in orderDetails:', sampleOrder.orderDetails.status);
        }
      }
      
      // Process orders to ensure status field exists
      const normalizedOrders = processedOrders.map(order => {
        // Determine the correct status field - check multiple possible locations
        let orderStatus = 'pending'; // Default status
        
        if (order.status) {
          orderStatus = order.status;
        } else if (order.orderStatus) {
          orderStatus = order.orderStatus;
        } else if (order.state) {
          orderStatus = order.state;
        } else if (order.currentStatus) {
          orderStatus = order.currentStatus;
        } else if (order.orderDetails && order.orderDetails.status) {
          orderStatus = order.orderDetails.status;
        }
        
        // Return normalized order with guaranteed status field
        return {
          ...order,
          status: orderStatus
        };
      });
      
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error loading orders: ' + (error.message || 'Unknown error'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }; 

  const getStatusBadge = (status) => {
    if (!status)
      return (
        <span
          style={{
            display: "inline-block",
            padding: "0.25em 0.4em",
            fontSize: "75%",
            fontWeight: "700",
            lineHeight: "1",
            textAlign: "center",
            whiteSpace: "nowrap",
            verticalAlign: "baseline",
            borderRadius: "0.25rem",
            backgroundColor: "#6c757d",
            color: "white",
          }}
        >
          UNKNOWN
        </span>
      );

    const colorMap = {
      pending: "#ffc107", // warning
      confirmed: "#17a2b8", // info
      shipped: "#0d6efd", // primary
      delivered: "#28a745", // success
      cancelled: "#dc3545", // danger
    };

    const bgColor = colorMap[status.toLowerCase()] || "#6c757d";

    return (
      <span
        style={{
          display: "inline-block",
          padding: "0.25em 0.4em",
          fontSize: "75%",
          fontWeight: "700",
          lineHeight: "1",
          textAlign: "center",
          whiteSpace: "nowrap",
          verticalAlign: "baseline",
          borderRadius: "0.25rem",
          backgroundColor: bgColor,
          color: "white",
          position: "relative",
          zIndex: "1",
        }}
      >
        {status.toUpperCase()}
      </span>
    );
  };
  // Get status badge color based on order status
  const getStatusBadgeColor = (status) => {
    if (!status) return 'secondary';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
      case 'canceled': // Handle alternative spelling
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return '0.00';
    
    try {
      return parseFloat(price).toFixed(2);
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0.00';
    }
  };

  return (
    <Helmet title="Order History">
      <CommonSection title="Your Orders" />
      <section className="profile-section">
        <Container>
          <Row>
            <Col lg="12">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                  <p className="mt-3">Loading your orders...</p>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <div className="alert alert-danger">{error}</div>
                  <Button
                    color="primary"
                    onClick={() => fetchOrders(currentPage)}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5">
                  <h4>No orders found</h4>
                  <p className="text-muted">You haven't placed any orders yet.</p>
                  <Link to="/shop" className="btn btn-primary mt-3">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table className="order-history-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>
                              {order.OrderItems 
                                ? `${order.OrderItems.length} item${order.OrderItems.length !== 1 ? 's' : ''}`
                                : '1 item'}
                            </td>
                            <td>${formatPrice(order.totalAmount)}</td>
                            <td style={{ position: "relative" }}>
                              {order.status
                                ? getStatusBadge(order.status)
                                : getStatusBadge("pending")}
                            </td>
                            <td>
                              <Link
                                to={`/orders/${order.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination if needed */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav aria-label="Order pagination">
                        <ul className="pagination">
                          <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage <= 1}
                            >
                              Previous
                            </button>
                          </li>
                          
                          {[...Array(totalPages).keys()].map(page => (
                            <li 
                              key={page + 1} 
                              className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(page + 1)}
                              >
                                {page + 1}
                              </button>
                            </li>
                          ))}
                          
                          <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage >= totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
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