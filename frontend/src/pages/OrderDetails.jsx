import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Table,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Spinner,
} from "reactstrap";
import { OrderService } from "../services/api";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import "../styles/profile.css";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    fetchOrderStatusHistory();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching order details for order ID:", orderId);
      const response = await OrderService.getOrderDetails(orderId);
      console.log("Order details response:", response);

      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        setError("Failed to load order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(
        "Error loading order details: " + (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatusHistory = async () => {
    setHistoryLoading(true);

    try {
      console.log("Fetching order status history for order ID:", orderId);
      const response = await OrderService.getOrderStatusHistory(orderId);
      console.log("Status history response:", response);

      if (response.success && response.statusHistory) {
        setStatusHistory(response.statusHistory);
      } else if (
        response.OrderStatuses &&
        Array.isArray(response.OrderStatuses)
      ) {
        // Alternative format
        setStatusHistory(response.OrderStatuses);
      } else {
        console.log("No status history available");
        setStatusHistory([]);
      }
    } catch (error) {
      console.error("Error fetching order status history:", error);
      setStatusHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  // === Grand total breakdown ===
  const subtotal = order?.OrderItems?.reduce(
    (acc, item) => acc + parseFloat(item.totalPrice || 0),
    0
  );
  const discountAmount = 0
  const loyaltyPointsDiscount = parseFloat(order?.loyaltyPointsUsed || 0) / 100;
  const shippingFee = parseFloat(order?.shippingFee || 0);
  const grandTotal =
    subtotal + shippingFee - discountAmount - loyaltyPointsDiscount;

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "shipped":
        return "primary";
      case "delivered":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Get payment method display name
  const getPaymentMethodName = (method) => {
    switch (method) {
      case "cod":
        return "Cash on Delivery";
      case "card":
        return "Credit/Debit Card";
      default:
        return method;
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <Helmet title={`Order #${orderId}`}>
      <CommonSection title={`Order Details #${orderId}`} />
      <section className="profile-section py-5">
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
              <p className="text-muted">
                The requested order could not be found.
              </p>
              <Link to="/orders" className="btn btn-primary mt-3">
                Back to Orders
              </Link>
            </div>
          ) : (
            <Row>
              {/* Order Summary */}
              <Col lg="8" md="12" className="mb-4">
                <Card className="h-100 shadow-sm">
                  <CardHeader className="bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Order Summary</h4>
                      <Badge
                        color={getStatusBadgeColor(order.status)}
                        className="px-3 py-2"
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <Row className="mb-4">
                      <Col md="6">
                        <p className="mb-1">
                          <strong>Order Date:</strong>{" "}
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="mb-1">
                          <strong>Order ID:</strong> #{order.id}
                        </p>
                        <p className="mb-1">
                          <strong>Payment Method:</strong>{" "}
                          {getPaymentMethodName(order.paymentMethod)}
                        </p>
                        <p className="mb-1">
                          <strong>Payment Status:</strong>{" "}
                          <Badge
                            color={getPaymentStatusColor(order.paymentStatus)}
                          >
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
                            <strong>Loyalty Points Earned:</strong>{" "}
                            {formatPrice(order.loyaltyPointsEarned)}
                          </p>
                        )}
                        {parseFloat(order.loyaltyPointsUsed || 0) > 0 && (
                          <p className="mb-1">
                            <strong>Loyalty Points:</strong> - $
                            {(order.loyaltyPointsUsed / 100).toFixed(2)}
                          </p>
                        )}
                      </Col>
                    </Row>

                    {/* Order Items */}
                    <h5 className="mb-3">Ordered Items</h5>
                    <div className="table-responsive">
                      <Table className="mb-0 border">
                        <thead className="bg-light">
                          <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.OrderItems &&
                            order.OrderItems.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {item.productData &&
                                      item.productData.image && (
                                        <img
                                          src={
                                            typeof item.productData.image ===
                                              "string" &&
                                            item.productData.image.startsWith(
                                              "["
                                            )
                                              ? JSON.parse(
                                                  item.productData.image
                                                )[0]
                                              : item.productData.image
                                          }
                                          alt={
                                            item.productData?.name || "Product"
                                          }
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            objectFit: "contain",
                                            marginRight: "10px",
                                            border: "1px solid #eee",
                                            borderRadius: "4px",
                                          }}
                                          onError={(e) => {
                                            e.target.src = "/placeholder.png";
                                          }}
                                        />
                                      )}
                                    <div>
                                      <p className="mb-0 fw-bold">
                                        {item.productData?.name || "Product"}
                                      </p>
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
                                <td className="text-end">
                                  ${formatPrice(item.totalPrice)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-light">
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Subtotal:</strong>
                            </td>
                            <td className="text-end">
                              ${formatPrice(subtotal)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Shipping Fee:</strong>
                            </td>
                            <td className="text-end">
                              ${formatPrice(shippingFee)}
                            </td>
                          </tr>
                          {discountAmount > 0 && (
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>Discount:</strong>
                              </td>
                              <td className="text-end">
                                $0
                              </td>
                            </tr>
                          )}
                          {loyaltyPointsDiscount > 0 && (
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>Loyalty Points:</strong>
                              </td>
                              <td className="text-end">
                                -${formatPrice(loyaltyPointsDiscount)}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Total:</strong>
                            </td>
                            <td className="text-end fw-bold h5 mb-0">
                              ${formatPrice(grandTotal)}
                            </td>
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
                <Card className="mb-4 shadow-sm">
                  <CardHeader className="bg-white">
                    <h5 className="mb-0">Shipping Information</h5>
                  </CardHeader>
                  <CardBody>
                    {order.shippingAddress && (
                      <div>
                        <p className="mb-1">
                          <strong>Name:</strong> {order.shippingAddress.name}
                        </p>
                        <p className="mb-1">
                          <strong>Address:</strong>{" "}
                          {order.shippingAddress.addressLine1}
                        </p>
                        {order.shippingAddress.addressLine2 && (
                          <p className="mb-1">
                            {order.shippingAddress.addressLine2}
                          </p>
                        )}
                        <p className="mb-1">
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state},
                          {order.shippingAddress.postalCode}
                        </p>
                        <p className="mb-1">
                          <strong>Country:</strong>{" "}
                          {order.shippingAddress.country}
                        </p>
                        <p className="mb-0">
                          <strong>Phone:</strong> {order.shippingAddress.phone}
                        </p>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Order Status Timeline */}
                <Card className="shadow-sm">
                  <CardHeader className="bg-white">
                    <h5 className="mb-0">Order Status Timeline</h5>
                  </CardHeader>
                  <CardBody>
                    {historyLoading ? (
                      <div className="text-center py-3">
                        <Spinner size="sm" color="primary" />
                        <p className="mb-0 mt-2 small">
                          Loading status history...
                        </p>
                      </div>
                    ) : statusHistory && statusHistory.length > 0 ? (
                      <div className="status-timeline">
                        {statusHistory.map((status, index) => (
                          <div
                            key={status.id || index}
                            className="status-item position-relative mb-4"
                          >
                            <div className="d-flex">
                              <div className="status-indicator me-3">
                                <div
                                  className={`status-dot bg-${getStatusBadgeColor(
                                    status.status
                                  )}`}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    marginTop: "4px",
                                  }}
                                ></div>
                                {index < statusHistory.length - 1 && (
                                  <div
                                    className="status-line"
                                    style={{
                                      width: "2px",
                                      height: "40px",
                                      background: "#e9ecef",
                                      marginLeft: "7px",
                                      marginTop: "4px",
                                    }}
                                  ></div>
                                )}
                              </div>
                              <div>
                                <p className="mb-1 text-muted small">
                                  {formatDate(status.createdAt)}
                                </p>
                                {status.note && (
                                  <p className="mb-0 small">{status.note}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-muted mb-0">
                          No status updates available
                        </p>
                      </div>
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
