import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Table,
  Badge,
  Button,
  Spinner,
  Form,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { toast } from "react-toastify";
import { OrderService, AdminService } from "../../services/api";

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: "",
    note: "",
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Use AdminService instead of OrderService
      const response = await AdminService.getOrderDetails(orderId);
      if (response.success) {
        setOrder(response.order);

        // Also fetch status history if available
        try {
          const historyResponse = await AdminService.getOrderStatusHistory(
            orderId
          );
          if (historyResponse && historyResponse.statusHistory) {
            setStatusHistory(historyResponse.statusHistory);
          }
        } catch (historyError) {
          console.error("Error fetching status history:", historyError);
          // Continue even if history fails
        }
      } else {
        toast.error("Failed to load order details");
        navigate("/admin/orders");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatusForm({
      ...statusForm,
      [e.target.name]: e.target.value,
    });
  };

  const openStatusModal = () => {
    setStatusForm({
      status: order?.status || "pending",
      note: "",
    });
    setModal(true);
  };

  const handleSubmitStatus = async (e) => {
    e.preventDefault();

    if (statusForm.status === order.status) {
      toast.info("Status remains unchanged");
      setModal(false);
      return;
    }

    try {
      const response = await AdminService.updateOrderStatus(
        orderId,
        statusForm
      );

      if (response.success) {
        toast.success("Order status updated successfully");
        setModal(false);
        fetchOrderDetails(); // Refresh order details
      } else {
        toast.error(response.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
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

  const getPaymentStatusBadge = (status) => {
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
      paid: "#28a745", // success
      failed: "#dc3545", // danger
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner color="primary" />
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-5">
        <h4>Order not found</h4>
        <Button color="primary" tag={Link} to="/admin/orders" className="mt-3">
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-order-details">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Order #{orderId}</h2>
        <Button color="primary" onClick={openStatusModal}>
          Update Status
        </Button>
      </div>

      <Row>
        <Col md="8">
          {/* Order Summary */}
          <Card className="mb-4">
            <CardHeader>
              <h5 className="mb-0">Order Summary</h5>
            </CardHeader>
            <CardBody>
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <p className="mb-1">
                    <strong>Order Date:</strong> {formatDate(order.createdAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Customer:</strong>{" "}
                    {order.shippingAddress?.name || "Guest"}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {order.email}
                  </p>
                </div>
                <div className="text-end">
                  <p className="mb-1">
                    <strong>Status:</strong> {getStatusBadge(order.status)}
                  </p>
                  <p className="mb-1">
                    <strong>Payment Method:</strong>{" "}
                    {getPaymentMethodName(order.paymentMethod)}
                  </p>
                  <p className="mb-1">
                    <strong>Payment Status:</strong>{" "}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </p>
                </div>
              </div>

              {/* Line items */}
              <h6 className="mb-3">Order Items</h6>
              <div className="table-responsive">
                <Table bordered>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.OrderItems?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.productData?.image && (
                              <img
                                src={
                                  typeof item.productData.image === "string" &&
                                  item.productData.image.startsWith("[")
                                    ? JSON.parse(item.productData.image)[0]
                                    : item.productData.image
                                }
                                alt="Product"
                                className="me-2"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "contain",
                                }}
                                onError={(e) => {
                                  e.target.src = "/placeholder.png";
                                }}
                              />
                            )}
                            <div>
                              <div>
                                {item.productData?.name ||
                                  `Product #${item.productId}`}
                              </div>
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
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Subtotal:</strong>
                      </td>
                      <td className="text-end">
                        $
                        {formatPrice(
                          parseFloat(order.totalAmount) -
                            parseFloat(order.shippingFee || 0) +
                            parseFloat(order.discountAmount || 0) +
                            parseFloat(order.loyaltyPointsUsed || 0)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Shipping Fee:</strong>
                      </td>
                      <td className="text-end">
                        ${formatPrice(order.shippingFee || 0)}
                      </td>
                    </tr>
                    {parseFloat(order.discountAmount || 0) > 0 && (
                      <tr>
                        <td colSpan="3" className="text-end">
                          <strong>Discount:</strong>
                        </td>
                        <td className="text-end">
                          -${formatPrice(order.discountAmount)}
                        </td>
                      </tr>
                    )}
                    {order.discountCode && (
                      <tr>
                        <td colSpan="3" className="text-end">
                          <strong>Discount Code:</strong>
                        </td>
                        <td className="text-end">{order.discountCode}</td>
                      </tr>
                    )}
                    {parseFloat(order.loyaltyPointsUsed || 0) > 0 && (
                      <tr>
                        <td colSpan="3" className="text-end">
                          <strong>Loyalty Points Used:</strong>
                        </td>
                        <td className="text-end">
                          -${formatPrice(order.loyaltyPointsUsed)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Total:</strong>
                      </td>
                      <td className="text-end fw-bold">
                        ${formatPrice(order.totalAmount)}
                      </td>
                    </tr>
                    {parseFloat(order.loyaltyPointsEarned || 0) > 0 && (
                      <tr>
                        <td colSpan="3" className="text-end">
                          <strong>Loyalty Points Earned:</strong>
                        </td>
                        <td className="text-end">
                          ${formatPrice(order.loyaltyPointsEarned)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md="4">
          {/* Shipping Information */}
          <Card className="mb-4">
            <CardHeader>
              <h5 className="mb-0">Shipping Information</h5>
            </CardHeader>
            <CardBody>
              {order.shippingAddress && (
                <>
                  <p className="mb-1">
                    <strong>Name:</strong> {order.shippingAddress.name}
                  </p>
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
                  <p className="mb-1">
                    <strong>Country:</strong> {order.shippingAddress.country}
                  </p>
                  <p className="mb-0">
                    <strong>Phone:</strong> {order.shippingAddress.phone}
                  </p>
                </>
              )}
            </CardBody>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <h5 className="mb-0">Status History</h5>
            </CardHeader>
            <CardBody>
              {statusHistory.length === 0 ? (
                <p>No status updates found</p>
              ) : (
                <div className="status-timeline">
                  {statusHistory.map((status, index) => (
                    <div key={status.id} className="position-relative pb-3">
                      <div className="d-flex mb-2">
                        <div className="me-3">
                          <span className="status-dot bg-primary"></span>
                          {index < statusHistory.length - 1 && (
                            <div className="status-line"></div>
                          )}
                        </div>
                        <div style={{ position: "relative", zIndex: "1" }}>
                          <div
                            className="mb-1"
                            style={{ position: "relative" }}
                          >
                            {getStatusBadge(status.status)}
                          </div>
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
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <div className="text-center mt-4">
        <Button color="secondary" tag={Link} to="/admin/orders">
          Back to Orders
        </Button>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={modal} toggle={() => setModal(!modal)}>
        <ModalHeader toggle={() => setModal(!modal)}>
          Update Order Status
        </ModalHeader>
        <Form onSubmit={handleSubmitStatus}>
          <ModalBody>
            <FormGroup>
              <Label for="status">Status</Label>
              <Input
                type="select"
                name="status"
                id="status"
                value={statusForm.status}
                onChange={handleStatusChange}
                required
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Input>
            </FormGroup>
            <FormGroup>
              <Label for="note">Note (Optional)</Label>
              <Input
                type="textarea"
                name="note"
                id="note"
                placeholder="Add a note about this status change..."
                value={statusForm.note}
                onChange={handleStatusChange}
                rows="3"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModal(!modal)}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Update Status
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminOrderDetails;
