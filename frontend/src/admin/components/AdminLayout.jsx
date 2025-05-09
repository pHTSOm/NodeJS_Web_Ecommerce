import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Outlet, useLocation } from 'react-router-dom';
import AdminNav from '../../components/AdminNav';
import Helmet from '../../components/Helmet/Helmet';

const AdminLayout = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop();
  
  // Generate title based on current path
  let title = 'Admin Dashboard';
  if (path === 'products') title = 'Product Management';
  else if (path === 'users') title = 'User Management';
  else if (path.includes('edit')) title = 'Edit Product';
  
  return (
    <Helmet title={title}>
      <AdminNav />
      <section className="admin-section py-4">
        <Container>
          <Row>
            <Col>
              <Outlet /> {/* This will render the child routes */}
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default AdminLayout;