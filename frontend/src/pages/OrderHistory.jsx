import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { OrderService } from '../services/api';
import CommonSection from '../components/UI/CommonSection';
import Helmet from '../components/Helmet/Helmet';
import '../styles/profile.css';
const debugOrderResponse = (response) => {
    console.log("=========== ORDER HISTORY DEBUG INFO ===========");
    console.log("Full response object:", response);
    console.log("Response type:", typeof response);
    console.log("Has 'orders' property:", response && Array.isArray(response.orders));
    
    if (response && response.orders) {
      console.log("First order example:", response.orders[0]);
      console.log("Number of orders:", response.orders.length);
    } else if (response && Array.isArray(response)) {
      console.log("Response is array with length:", response.length);
      if (response.length > 0) {
        console.log("First item example:", response[0]);
      }
    } else {
      console.log("Unknown response format");
    }
    console.log("=================================================");
  };
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
      
      // Debug the response structure
      debugOrderResponse(response);
      
      // Handle different response formats
      if (response && response.success === true && Array.isArray(response.orders)) {
        // Format 1: { success: true, orders: [...] }
        setOrders(response.orders);
        
        // Set pagination info if available
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
        }
      } else if (response && response.success === true && response.data && Array.isArray(response.data.orders)) {
        // Format 2: { success: true, data: { orders: [...] } }
        setOrders(response.data.orders);
        
        // Set pagination info if available
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      } else if (Array.isArray(response)) {
        // Format 3: Direct array of orders
        setOrders(response);
        setTotalPages(1); // No pagination info available
      } else {
        console.error("Unknown response format:", response);
        setError('Invalid response format');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error loading orders: ' + (error.message || 'Unknown error'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }; 

  // Get status badge color based on order status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format price
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
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
                                : '0 items'}
                            </td>
                            <td>${formatPrice(order.totalAmount)}</td>
                            <td>
                              <Badge color={getStatusBadgeColor(order.status)}>
                                {order.status}
                              </Badge>
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