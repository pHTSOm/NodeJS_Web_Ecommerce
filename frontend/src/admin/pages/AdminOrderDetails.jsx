import React from "react";
import { useParams } from "react-router-dom";
import { Row, Col } from "reactstrap";

const AdminOrderDetails = () => {
  const { orderId } = useParams();

  return (
    <div className="admin-order-details">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Order #{orderId} Details</h2>
      </div>
      
      <Row>
        <Col>
          <div className="card">
            <div className="card-body text-center py-5">
              <h3>Order Details</h3>
              <p>This feature is coming soon.</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminOrderDetails;