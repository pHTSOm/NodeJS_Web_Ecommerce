import React, { useState, useEffect } from "react";
import { Row, Col, Card, CardBody, CardHeader, Button } from "reactstrap";
import { Link } from "react-router-dom";
import StatsCard from "../components/Dashboard/StatsCard";
import { AdminService, ProductService } from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    newProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const productsResponse = await ProductService.getAllProducts({
          limit: 1000,
        });
        const products = productsResponse.products || [];

        // Fetch users (assuming you'll implement this)
        let users = [];
        try {
          const usersResponse = await AdminService.getAllUsers();
          users = usersResponse.users || [];
        } catch (error) {
          console.error("Error fetching users:", error);
        }

        // Calculate stats
        const newProductsCount = products.filter((p) => p.isNew).length;

        // Fetch order statistics
        let orderStats = {
          totalOrders: 0,
          revenue: 0,
        };

        try {
          const statsResponse = await AdminService.getOrderStats();
          if (statsResponse.success) {
            orderStats = {
              totalOrders: statsResponse.stats.orderCount || 0,
              revenue: statsResponse.stats.revenue || 0,
            };
          }
        } catch (error) {
          console.error("Error fetching order stats:", error);
        }

        // Update state - for now with placeholder data for orders/revenue
        setStats({
          totalProducts: products.length,
          newProducts: newProductsCount,
          totalUsers: users.length,
          totalOrders: orderStats.totalOrders,
          revenue: orderStats.revenue,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <div>
          <Button color="primary" tag={Link} to="/admin/products">
            Manage Products
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md="3">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            icon="ri-shopping-bag-line"
            color="primary"
          />
        </Col>
        <Col md="3">
          <StatsCard
            title="New Products"
            value={stats.newProducts}
            icon="ri-price-tag-3-line"
            color="success"
          />
        </Col>
        <Col md="3">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon="ri-user-line"
            color="info"
          />
        </Col>
        <Col md="3">
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="ri-shopping-cart-line"
            color="warning"
          />
        </Col>
      </Row>

      {/* Recent Products */}
      <Row>
        <Col lg="8">
          <Card className="mb-4">
            <CardHeader className="d-flex justify-content-between">
              <h5 className="mb-0">Recent Products</h5>
              <Link to="/admin/products" className="text-decoration-none">
                View All
              </Link>
            </CardHeader>
            <CardBody>
              {loading ? (
                <p className="text-center">Loading products...</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* This is placeholder content - implement when you have actual product data */}
                      <tr>
                        <td colSpan="4" className="text-center">
                          No products found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col lg="4">
          <Card className="mb-4">
            <CardHeader>
              <h5 className="mb-0">Quick Actions</h5>
            </CardHeader>
            <CardBody>
              <div className="d-grid gap-2">
                <Button color="primary" tag={Link} to="/admin/products/add">
                  <i className="ri-add-line me-2"></i> Add New Product
                </Button>
                <Button color="outline-primary" tag={Link} to="/admin/users">
                  <i className="ri-user-settings-line me-2"></i> Manage Users
                </Button>
                <Button color="outline-primary" tag={Link} to="/admin/orders">
                  <i className="ri-file-list-3-line me-2"></i> View Orders
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
