import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "reactstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import { OrderService } from "../services/api";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    // Try to fetch the order details, but don't block confirmation if it fails
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await OrderService.getOrderDetails(orderId);
        if (response && response.success && response.order) {
          setOrder(response.order);
        } else {
          // If order details aren't available, still show confirmation
          console.log("Order details not available, using basic confirmation");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        // Just log the error - don't set error state which would show error UI
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <Helmet title="Order Confirmation">
      <CommonSection title="Order Confirmation" />
      <section className="py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="shadow-sm border-0">
                <div className="card-body p-5 text-center">
                  <div className="mb-4">
                    <i
                      className="ri-checkbox-circle-line text-success"
                      style={{ fontSize: "4rem" }}
                    ></i>
                  </div>

                  <h2 className="mb-3">Thank You For Your Order!</h2>
                  <p className="mb-4">
                    Your order has been placed successfully and is being
                    processed.
                  </p>

                  <div className="order-confirmation-details mb-4">
                    <h5 className="border-bottom pb-2 mb-3">
                      Order Information
                    </h5>
                    <p className="mb-1">
                      <strong>Order Number:</strong> #{orderId}
                    </p>
                    {order && (
                      <>
                        <p className="mb-1">
                          <strong>Date:</strong>{" "}
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <p className="mb-1">
                          <strong>Subtotal:</strong> $
                          {formatPrice(order.subtotal)}
                        </p>
                        <p className="mb-1">
                          <strong>Shipping Fee:</strong> $
                          {formatPrice(order.shippingFee)}
                        </p>
                        {parseFloat(order.discountAmount || 0) > 0 && (
                          <p className="mb-1">
                            <strong>Discount:</strong> -$
                            {formatPrice(order.discountAmount)}
                          </p>
                        )}
                        {parseFloat(order.loyaltyPointsUsed || 0) > 0 && (
                          <p className="mb-1">
                            <strong>Loyalty Points:</strong> -$
                            {formatPrice(order.loyaltyPointsUsed / 100)}
                          </p>
                        )}
                        <p className="mb-1">
                          <strong>Total Amount:</strong> $
                          {formatPrice(order.totalAmount)}
                        </p>

                        <p className="mb-1">
                          <strong>Status:</strong> {order.status}
                        </p>
                        <p className="mb-1">
                          <strong>Payment Method:</strong>{" "}
                          {order.paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : "Credit Card"}
                        </p>
                      </>
                    )}
                  </div>

                  <p className="text-muted mb-4">
                    We've sent a confirmation email with all the details of your
                    order.
                    {order?.email && ` A copy has been sent to ${order.email}.`}
                  </p>

                  <div className="d-flex justify-content-center gap-3">
                    <Button color="primary" tag={Link} to="/shop">
                      Continue Shopping
                    </Button>

                    <Button color="outline-primary" tag={Link} to="/orders">
                      View Orders
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default OrderConfirmation;
