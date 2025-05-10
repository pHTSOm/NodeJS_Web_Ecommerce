import React from "react";
import { Container, Row, Col, Button } from "reactstrap";
import { Link, useParams } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";


const OrderConfirmation = () => {
  const { orderId } = useParams();

  return (
    <Helmet title="Order Confirmation">
      <CommonSection title="Order Confirmation" />
      <section>
        <Container>
          <Row>
            <Col lg="8" className="mx-auto">
              <div className="card shadow-sm mb-5">
                <div className="card-body text-center py-5">
                  <div className="mb-4">
                    <i className="ri-check-double-line" style={{ fontSize: '4rem', color: 'green' }}></i>
                  </div>
                  <h2>Thank You for Your Order!</h2>
                  <p className="lead mb-4">
                    Your order #{orderId} has been placed successfully.
                  </p>
                  <p>A confirmation email will be sent to your email address.</p>
                  <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button tag={Link} to="/shop" color="primary">
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default OrderConfirmation;