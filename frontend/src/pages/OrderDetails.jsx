import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Table, Card, CardBody, Badge, Spinner } from 'reactstrap';
import { OrderService } from '../services/api';
import CommonSection from '../components/UI/CommonSection';
import Helmet from '../components/Helmet/Helmet';
import '../styles/profile.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching order details for order ID:', orderId);
      const response = await OrderService.getOrderDetails(orderId);
      console.log('Order details response:', response);

      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        setError('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Error loading order details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
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

  // Get status badge color
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

  // Get payment method display name
  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'cod':
        return 'Cash on Delivery';
      case 'card':
        return 'Credit/Debit Card';
      default:
        return method;
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Helmet title={`Order #${orderId}`}>
      <CommonSection title={`Order Details #${orderId}`} />
      <section className="profile-section">
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="mt-3">Loading order details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <div className="alert alert-danger">{error}</div>
              <button
                className="btn btn-primary mt-3"
                onClick={fetchOrderDetails}
              >
                Try Again
              </button>
            </div>
          ) : !order ? (
            <div className="text-center py-5">
              <h4>Order not found</h4>
              <p className="text-muted">The requested order could not be found.</p>
              <Link to="/orders" className="btn btn-primary mt-3">
                Back to Orders
              </Link>
            </div>
          ) : (
            <Row>
              {/* Order Summary */}
              <Col lg="8" md="12" className="mb-4">
                <Card className="h-100">
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="mb-0">Order Summary</h4>
                      <Badge color={getStatusBadgeColor(order.status)} className="px-3 py-2">
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>

                    <Row className="mb-4">
                      <Col md="6">
                        <p className="mb-1">
                          <strong>Order Date:</strong> {formatDate(order.createdAt)}
                        </p>
                        <p className="mb-1">
                          <strong>Order ID:</strong> #{order.id}
                        </p>
                        <p className="mb-1">
                          <strong>Payment Method:</strong> {getPaymentMethodName(order.paymentMethod)}
                        </p>
                        <p className="mb-1">
                          <strong>Payment Status:</strong>{' '}
                          <Badge color={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </p>
                      </Col>
                      <Col md="6">
                        <p className="mb-1">
                          <strong>Email:</strong> {order.email}
                        </p>
                        {order.discountCode && (
                          <p className="mb-1">
                            <strong>Discount Code:</strong> {order.discountCode}
                          </p>
                        )}
                        {parseFloat(order.loyaltyPointsEarned) > 0 && (
                          <p className="mb-1">
                            <strong>Loyalty Points Earned:</strong> {formatPrice(order.loyaltyPointsEarned)}
                          </p>
                        )}
                        {parseFloat(order.loyaltyPointsUsed) > 0 && (
                          <p className="mb-1">
                            <strong>Loyalty Points Used:</strong> {formatPrice(order.loyaltyPointsUsed)}
                          </p>
                        )}
                      </Col>
                    </Row>

                    {/* Order Items */}
                    <h5 className="mb-3">Ordered Items</h5>
                    <div className="table-responsive">
                      <Table className="mb-0">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.OrderItems && order.OrderItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {item.productData && item.productData.image && (
                                    <img
                                      src={
                                        typeof item.productData.image === 'string' && item.productData.image.startsWith('[')
                                          ? JSON.parse(item.productData.image)[0]
                                          : item.productData.image
                                      }
                                      alt={item.productData?.name || 'Product'}
                                      style={{
                                        width: '50px',
                                        height: '50px',
                                        objectFit: 'contain',
                                        marginRight: '10px',
                                        border: '1px solid #eee',
                                        borderRadius: '4px',
                                      }}
                                      onError={(e) => {
                                        e.target.src = '/placeholder.png';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <p className="mb-0 fw-bold">{item.productData?.name || 'Product'}</p>
                                    {item.productData?.variant && (
                                      <small className="text-muted">
                                        {item.productData.variant.name}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>${formatPrice(item.price)}</td>
                              <td>{item.quantity}</td>
                              <td className="text-end">${formatPrice(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Subtotal:</strong>
                            </td>
                            <td className="text-end">
                              ${formatPrice(
                                parseFloat(order.totalAmount) - parseFloat(order.shippingFee) + 
                                parseFloat(order.discountAmount) + parseFloat(order.loyaltyPointsUsed)
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Shipping Fee:</strong>
                            </td>
                            <td className="text-end">${formatPrice(order.shippingFee)}</td>
                          </tr>
                          {parseFloat(order.discountAmount) > 0 && (
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>Discount:</strong>
                              </td>
                              <td className="text-end">-${formatPrice(order.discountAmount)}</td>
                            </tr>
                          )}
                          {parseFloat(order.loyaltyPointsUsed) > 0 && (
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>Loyalty Points:</strong>
                              </td>
                              <td className="text-end">-${formatPrice(order.loyaltyPointsUsed)}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Total:</strong>
                            </td>
                            <td className="text-end fw-bold">${formatPrice(order.totalAmount)}</td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Shipping Information & Order Status */}
              <Col lg="4" md="12">
                {/* Shipping Information */}
                <Card className="mb-4">
                  <CardBody>
                    <h5 className="mb-3">Shipping Information</h5>
                    {order.shippingAddress && (
                      <div>
                      <p className="mb-1"><strong>Name:</strong> {order.shippingAddress.name}</p>
                      <p className="mb-1">
                    <strong>Address:</strong>{" "}
                    {order.shippingAddress.addressLine1}
                  </p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="mb-1">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="mb-1">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                      <p className="mb-1"><strong>Country:</strong> {order.shippingAddress.country}</p>
                      <p className="mb-0"><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                    </div>
                    )}
                  </CardBody>
                </Card>

                {/* Order Status Timeline */}
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Order Status Timeline</h5>
                    {order.OrderStatuses && order.OrderStatuses.length > 0 ? (
                      <div className="status-timeline">
                        {order.OrderStatuses.map((status, index) => (
                          <div key={status.id} className="position-relative mb-4">
                            <div className="d-flex">
                              <div className="me-3">
                                <div className="status-dot"></div>
                                {index < order.OrderStatuses.length - 1 && (
                                  <div className="status-line"></div>
                                )}
                              </div>
                              <div>
                                <h6 className="mb-1">
                                  <Badge color={getStatusBadgeColor(status.status)}>
                                    {status.status.toUpperCase()}
                                  </Badge>
                                </h6>
                                <p className="mb-1 text-muted small">
                                  {formatDate(status.createdAt)}
                                </p>
                                {status.note && <p className="mb-0">{status.note}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No status updates available</p>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Action Buttons */}
              <Col lg="12" className="mt-4 text-center">
                <Link to="/orders" className="btn btn-outline-primary me-3">
                  Back to Orders
                </Link>
                <Link to="/shop" className="btn btn-primary">
                  Continue Shopping
                </Link>
              </Col>
            </Row>
          )}
        </Container>
      </section>
    </Helmet>
  );
};

export default OrderDetails;