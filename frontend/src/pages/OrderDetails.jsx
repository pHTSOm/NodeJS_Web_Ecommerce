import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Table, Button, Card, CardBody, 
  Spinner, Badge, ListGroup, ListGroupItem 
} from "reactstrap";
import { useParams, Link } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { OrderService } from "../services/api";
import { toast } from "react-toastify";


const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    fetchOrderStatusHistory();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrderDetails(orderId);
      
      if (response.success) {
        setOrder(response.order);
        setOrderItems(response.order.OrderItems || []);
      } else {
        setError(response.message || "Failed to load order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("An error occurred while fetching the order details");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatusHistory = async () => {
    try {
      const response = await OrderService.getOrderStatusHistory(orderId);
      
      if (response.success) {
        setStatusHistory(response.statusHistory || []);
      }
    } catch (error) {
      console.error("Error fetching status history:", error);
      // Don't set main error, just log it
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

  if (loading) {
    return (
      <Helmet title={`Order #${orderId}`}>
        <CommonSection title={`Order #${orderId}`} />
        <section>
          <Container>
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="mt-3">Loading order details...</p>
            </div>
          </Container>
        </section>
      </Helmet>
    );
  }

  if (error || !order) {
    return (
      <Helmet title="Order Not Found">
        <CommonSection title="Order Details" />
        <section>
          <Container>
            <div className="text-center py-5">
              <div className="text-danger mb-3">
                <i className="ri-error-warning-line" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4>{error || "Order not found"}</h4>
              <div className="mt-4">
                <Button tag={Link} to="/orders" color="primary" className="me-2">
                  Back to Orders
                </Button>
                <Button tag={Link} to="/shop" color="secondary">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </Helmet>
    );
  }

  return (
    <Helmet title={`Order #${orderId}`}>
      <CommonSection title={`Order #${orderId}`} />
      <section>
        <Container>
          <Row>
            <Col lg="8">
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="mb-0">Order Details</h3>
                    <Badge color={getStatusBadgeColor(order.currentStatus)} pill size="lg">
                      {order.currentStatus}
                    </Badge>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Order Date:</strong></p>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Payment Method:</strong></p>
                      <p>{order.paymentMethod}</p>
                    </div>
                  </div>
                  
                  <h5 className="mb-3">Items</h5>
                  <div className="table-responsive mb-4">
                    <Table bordered>
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {item.productData?.image && (
                                  <img 
                                    src={item.productData.image}
                                    alt={item.productData.name}
                                    style={{ 
                                      width: "50px", 
                                      height: "50px", 
                                      objectFit: "contain",
                                      marginRight: "10px"
                                    }}
                                    onError={(e) => { e.target.src = "/placeholder.png"; }}
                                  />
                                )}
                                <div>
                                  <p className="mb-0 fw-bold">{item.productData?.name || "Product"}</p>
                                  {item.productData?.variant && (
                                    <small className="text-muted">{item.productData.variant.name}</small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>${parseFloat(item.price).toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <h5 className="mb-3">Shipping Address</h5>
                      <address>
                        <strong>{order.shippingAddress.name}</strong><br />
                        {order.shippingAddress.addressLine1}<br />
                        {order.shippingAddress.addressLine2 && (
                          <>{order.shippingAddress.addressLine2}<br /></>
                        )}
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                        {order.shippingAddress.country}<br />
                        <strong>Phone:</strong> {order.shippingAddress.phone}
                      </address>
                    </div>
                    
                    <div className="col-md-6">
                      <h5 className="mb-3">Order Summary</h5>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>${(parseFloat(order.totalAmount) - parseFloat(order.tax) - parseFloat(order.shippingCost) + parseFloat(order.discountAmount)).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Shipping:</span>
                        <span>${parseFloat(order.shippingCost).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Tax:</span>
                        <span>${parseFloat(order.tax).toFixed(2)}</span>
                      </div>
                      {parseFloat(order.discountAmount) > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Discount:</span>
                          <span className="text-success">-${parseFloat(order.discountAmount).toFixed(2)}</span>
                        </div>
                      )}
                      {order.loyaltyPointsUsed > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Loyalty Points:</span>
                          <span className="text-success">-${(order.loyaltyPointsUsed / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <hr />
                      <div className="d-flex justify-content-between">
                        <strong>Total:</strong>
                        <strong>${parseFloat(order.totalAmount).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <div className="d-flex justify-content-between mb-4">
                <Button tag={Link} to="/orders" color="secondary">
                  <i className="ri-arrow-left-line me-1"></i> Back to Orders
                </Button>
                <Button tag={Link} to="/shop" color="primary">
                  Continue Shopping <i className="ri-arrow-right-line ms-1"></i>
                </Button>
              </div>
            </Col>
            
            <Col lg="4">
              <Card className="mb-4">
                <CardBody>
                  <h4 className="mb-3">Order Status</h4>
                  <Badge 
                    color={getStatusBadgeColor(order.currentStatus)} 
                    className="mb-3 px-3 py-2"
                    style={{ fontSize: '1rem' }}
                  >
                    {order.currentStatus.toUpperCase()}
                  </Badge>
                  
                  <h5 className="mt-4 mb-3">Status History</h5>
                  {statusHistory.length > 0 ? (
                    <ListGroup>
                      {statusHistory.map((status, index) => (
                        <ListGroupItem key={status.id} className="border-0 ps-0">
                          <div className="d-flex">
                            <div className="status-timeline">
                              <div className="status-dot bg-primary"></div>
                              {index < statusHistory.length - 1 && (
                                <div className="status-line"></div>
                              )}
                            </div>
                            <div className="ms-3">
                              <div className="d-flex justify-content-between">
                                <Badge color={getStatusBadgeColor(status.status)}>
                                  {status.status}
                                </Badge>
                                <small className="text-muted">
                                  {formatDate(status.createdAt)}
                                </small>
                              </div>
                              {status.notes && (
                                <p className="mt-1 mb-0 small">{status.notes}</p>
                              )}
                            </div>
                          </div>
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  ) : (
                    <p>No status updates available.</p>
                  )}
                </CardBody>
              </Card>
              
              {order.loyaltyPointsEarned > 0 && (
                <Card className="mb-4 bg-light">
                  <CardBody>
                    <h5>Loyalty Points</h5>
                    <p className="mb-0">
                      You earned <strong>{order.loyaltyPointsEarned}</strong> loyalty points with this order!
                    </p>
                    <p className="mb-0 small text-muted">
                      (Worth ${(order.loyaltyPointsEarned / 100).toFixed(2)} on your next purchase)
                    </p>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default OrderDetails;