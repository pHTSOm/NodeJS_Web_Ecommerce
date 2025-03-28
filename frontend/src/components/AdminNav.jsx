
import React from "react";
import { Link } from "react-router-dom";
import { Container, Row } from "reactstrap";
import "../styles/admin-nav.css";

const AdminNav = () => {
  return (
    <section className="admin-nav">
      <Container>
        <Row>
          <div className="admin-menu d-flex align-items-center justify-content-center">
            <div className="admin-menu-item">
              <Link to="/admin/dashboard">Dashboard</Link>
            </div>
            <div className="admin-menu-item">
              <Link to="/admin/products">Products</Link>
            </div>
            <div className="admin-menu-item">
              <Link to="/admin/orders">Orders</Link>
            </div>
            <div className="admin-menu-item">
              <Link to="/admin/users">Users</Link>
            </div>
          </div>
        </Row>
      </Container>
    </section>
  );
};

export default AdminNav;