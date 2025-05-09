// frontend/src/components/AdminNav.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Container, Row } from "reactstrap";
import "../styles/admin-nav.css";

const AdminNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if a menu item is active
  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return currentPath === '/admin' || currentPath === '/admin/dashboard';
    }
    return currentPath.startsWith(path);
  };
  
  return (
    <section className="admin-nav">
      <Container>
        <Row>
          <div className="admin-menu d-flex align-items-center justify-content-center">
            <div className="admin-menu-item">
              <Link 
                to="/admin/dashboard"
                className={isActive('/admin/dashboard') ? 'active' : ''}
              >
                Dashboard
              </Link>
            </div>
            <div className="admin-menu-item">
              <Link 
                to="/admin/products"
                className={isActive('/admin/products') ? 'active' : ''}
              >
                Products
              </Link>
            </div>
            <div className="admin-menu-item">
              <Link 
                to="/admin/orders"
                className={isActive('/admin/orders') ? 'active' : ''}
              >
                Orders
              </Link>
            </div>
            <div className="admin-menu-item">
              <Link 
                to="/admin/users"
                className={isActive('/admin/users') ? 'active' : ''}
              >
                Users
              </Link>
            </div>
          </div>
        </Row>
      </Container>
    </section>
  );
};

export default AdminNav;