import React from 'react';
import './Footer.css';
import { Container, Row, Col, ListGroup, ListGroupItem } from "reactstrap";
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row className="footer__row">
          <Col lg='4' className='mb-4' md='6'>
            <div className="logo">
              <div>
                <h1 className='text-white'>For Money</h1>
              </div>
            </div>
            <p className="footer__text mt-4">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Labore delectus inventore corporis consequatur quasi sit ducimus.
              Dolore voluptates excepturi ipsam?
            </p>
          </Col>

          <Col lg='3' md='3' className="mb-4">
            <div className="footer__quick-links">
              <h4 className="quick__links-title">Top Categories</h4>
              <ListGroup>
                <ListGroupItem className='ps-0 border-0'>
                  <Link to='#'>Mobile Phones</Link>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0'>
                  <Link to='#'>Games</Link>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0'>
                  <Link to='#'>Consoles</Link>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0'>
                  <Link to='#'>Watch</Link>
                </ListGroupItem>
              </ListGroup>
            </div>
          </Col>

          <Col lg='2' md='3' className='mb-4'>
            <div className="footer__quick-links">
              <h4 className="quick__links-title">Useful Links</h4>
              <ListGroup>
                <ListGroupItem className='ps-0 border-0'>
                  <Link to='/shop'>Shop</Link>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0'>
                  <Link to='cart/'>Cart</Link>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0'>
                  <Link to='#'>Delivery</Link>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0'>
                  <Link to='#'>Privacy Policy</Link>
                </ListGroupItem>
              </ListGroup>
            </div>
          </Col>

          <Col lg='3' md='4'>
            <div className="footer__quick-links">
              <h4 className="quick__links-title">Contact</h4>
              <ListGroup className='footer__contact'>
                <ListGroupItem className='ps-0 border-0 d-flex 
                align-items-center gap-2'>
                  <span><i className="ri-map-pin-line"></i></span>
                  <p>123, Harvard Tan Phong,District 7,HoChiMinh City, Vietnam</p>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0 d-flex 
                align-items-center gap-2'>
                  <span><i className="ri-customer-service-line"></i></span>
                  <p>+081231283124</p>
                </ListGroupItem>

                <ListGroupItem className='ps-0 border-0 d-flex 
                align-items-center gap-2'>
                  <span><i className="ri-mail-line"></i></span>
                  <p>example123@yahoo.net</p>
                </ListGroupItem>
              </ListGroup>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg='12'>
            <p className="footer__copyright">Copyright {year} developed by Nguyen Truong Phat, Nguyen Cao Phi,
            Quach Chi Dung. All rights reserved</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
