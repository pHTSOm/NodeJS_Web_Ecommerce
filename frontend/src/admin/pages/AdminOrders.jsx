import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Table,
  Button,
  Input,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Form,
  FormGroup,
  Label,
  Badge,
  InputGroup,
} from "reactstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminService, OrderService } from "../../services/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeFilter, setTimeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, timeFilter, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Prepare filter parameters
      const params = {
        page: currentPage,
        limit: 20,
        timeFilter: timeFilter || undefined,
        status: statusFilter || undefined,
      };

      // Add custom date range if applicable
      if (
        timeFilter === "custom" &&
        customDateRange.startDate &&
        customDateRange.endDate
      ) {
        params.startDate = customDateRange.startDate;
        params.endDate = customDateRange.endDate;
      }

      const response = await AdminService.getAllOrders(params);

      if (response.success) {
        console.log("Raw orders response:", response);
        console.log("First order details:", response.orders[0]);
        console.log("Orders data:", response.orders); // Log the orders data
        setOrders(response.orders || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        toast.error(response.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilterChange = (e) => {
    setTimeFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleCustomDateChange = (e) => {
    const { name, value } = e.target;
    setCustomDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyCustomDate = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchOrders();
    } else {
      toast.warning("Please select both start and end dates");
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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

    // Map status to color
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

  return (
    <div className="admin-orders">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Order Management</h2>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h5 className="mb-0">Orders</h5>

            <div className="d-flex align-items-center gap-3 flex-wrap mt-2 mt-md-0">
              {/* Status filter */}
              <FormGroup className="mb-0">
                <Input
                  type="select"
                  name="statusFilter"
                  id="statusFilter"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  style={{ minWidth: "150px" }}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Input>
              </FormGroup>

              <FormGroup className="mb-0">
                <Input
                  type="select"
                  name="timeFilter"
                  id="timeFilter"
                  value={timeFilter}
                  onChange={handleTimeFilterChange}
                  style={{ minWidth: "150px" }}
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="custom">Custom Range</option>
                </Input>
              </FormGroup>

              {timeFilter === "custom" && (
                <div className="d-flex align-items-center gap-2">
                  <Input
                    type="date"
                    name="startDate"
                    value={customDateRange.startDate}
                    onChange={handleCustomDateChange}
                    style={{ width: "140px" }}
                  />
                  <span>to</span>
                  <Input
                    type="date"
                    name="endDate"
                    value={customDateRange.endDate}
                    onChange={handleCustomDateChange}
                    style={{ width: "140px" }}
                  />
                  <Button
                    color="primary"
                    size="sm"
                    onClick={handleApplyCustomDate}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="mt-2">Loading orders...</p>
            </div>
          ) : (
            <div className="table-responsive">
              {orders.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No orders found</h5>
                  <p>Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer</th>
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
                          <div>{order.shippingAddress?.name || "Guest"}</div>
                          <small className="text-muted">{order.email}</small>
                        </td>
                        <td>{order.OrderItems?.length || 0}</td>
                        <td>${formatPrice(order.totalAmount)}</td>
                        <td style={{ position: "relative" }}>
                          {order.status
                            ? getStatusBadge(order.status)
                            : getStatusBadge("pending")}
                        </td>
                        <td>
                          <Button
                            color="primary"
                            size="sm"
                            tag={Link}
                            to={`/admin/orders/${order.id}`}
                          >
                            <i className="ri-eye-line"></i> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav aria-label="Orders pagination">
                    <ul className="pagination">
                      <li
                        className={`page-item ${
                          currentPage <= 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          Previous
                        </button>
                      </li>

                      {[...Array(totalPages).keys()].map((page) => (
                        <li
                          key={page + 1}
                          className={`page-item ${
                            currentPage === page + 1 ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page + 1)}
                          >
                            {page + 1}
                          </button>
                        </li>
                      ))}

                      <li
                        className={`page-item ${
                          currentPage >= totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminOrders;
