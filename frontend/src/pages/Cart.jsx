import React from "react";
import "../styles/cart.css";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { Container, Row, Col } from "reactstrap";

import { motion } from "framer-motion";
import { cartActions } from "../slices/cartSlice";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  return (
    <Helmet title="Cart">
      <CommonSection title="Shopping Cart" />
      <section>
        <Container>
          <Row>
            <Col lg="9">
              {cartItems.length === 0 ? (
                <h2 className="fs-4 text-center">No item added to the cart</h2>
              ) : (
                <table className="table bordered">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Variant</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => (
                      <Tr item={item} key={index} />
                    ))}
                  </tbody>
                </table>
              )}
            </Col>

            <Col lg="3">
              <div>
                <h6 className="d-flex align-items-center justify-content-between">
                  Subtotal
                  <span className="fs-4 fw-bold">${totalAmount.toFixed(2)}</span>
                </h6>
              </div>
              <p className="fs-6 mt-2">
                taxes and shipping will calculate in checkout
              </p>
              <div>
                <button className="buy__btn w-100">
                  <Link to="/checkout">Checkout</Link>
                </button>
              </div>
              <button className="buy__btn w-100 mt-3">
                <Link to="/shop">Continue Shopping</Link>
              </button>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

const Tr = ({ item }) => {
  const dispatch = useDispatch();

  // Generate a consistent item identifier that includes the variant
  const getItemId = () => {
    if (item.variant) {
      return { productId: item.id, variantId: item.variant.id };
    }
    return { productId: item.id };
  };

  // Use the new deleteCartItem action that supports variants
  const deleteProduct = () => {
    dispatch(cartActions.deleteCartItem(getItemId()));
  };
  
  // Update increment/decrement to handle variants
  const incrementQuantity = () => {
    dispatch(cartActions.incrementItemQuantity(getItemId()));
  };
  
  const decrementQuantity = () => {
    dispatch(cartActions.decrementItemQuantity(getItemId()));
  };

  const imageUrl = item.imgUrl ? 
    (item.imgUrl.startsWith('http') ? item.imgUrl : `http://localhost:5000${item.imgUrl}`) 
    : '/placeholder.png';
  return (
    <tr>
      <td>
        <img src={imageUrl}
       alt={item.productName}
       style={{ 
        width: '80px', 
        height: '80px', 
        objectFit: 'contain',
        border: '1px solid #eee',
        borderRadius: '4px'
      }}
       onError={(e) => { e.target.src = '/placeholder.png'; }} />
      </td>
      <td>{item.productName}</td>
      <td>{item.variant ? item.variant.name : 'Standard'}</td>
      <td>${parseFloat(item.price).toFixed(2)}</td>
      <td><div className="quantity-control d-flex align-items-center gap-2">
    <motion.span 
      whileTap={{ scale: 1.2 }} 
      onClick={decrementQuantity}
      className="decrease"
      style={{ cursor: 'pointer' }}
    >
      <i className="ri-subtract-line"></i>
    </motion.span>
    <span>{item.quantity}</span>
    <motion.span 
      whileTap={{ scale: 1.2 }} 
      onClick={incrementQuantity}
      className="increase"
      style={{ cursor: 'pointer' }}
    >
      <i className="ri-add-line"></i>
    </motion.span>
  </div>
  </td>
      <td>
        <motion.i
          whileTap={{ scale: 1.2 }}
          onClick={deleteProduct}
          className="ri-delete-bin-6-line"
          style={{ cursor: 'pointer' }}
        ></motion.i>
      </td>
    </tr>
  );
};

export default Cart;