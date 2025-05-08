import React, { useEffect } from "react";
import "../styles/cart.css";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { Container, Row, Col, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../slices/cartSlice";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const loading = useSelector((state) => state.cart.loading);
  const error = useSelector((state) => state.cart.error);
  const dispatch = useDispatch();

  // Fetch cart on component mount
  useEffect(() => {
    dispatch(fetchCart())
      .unwrap()
      .catch((error) => {
        toast.error(error.message || "Failed to load cart");
      });
  }, [dispatch, AuthService.isLoggedIn()]);

  if (loading && cartItems.length === 0) {
    return (
      <Helmet title="Cart">
        <CommonSection title="Shopping Cart" />
        <section>
          <Container>
            <Row>
              <Col className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-3">Loading your cart...</p>
              </Col>
            </Row>
          </Container>
        </section>
      </Helmet>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <Helmet title="Cart">
        <CommonSection title="Shopping Cart" />
        <section>
          <Container>
            <Row>
              <Col className="text-center py-5">
                <h4 className="text-danger">Error loading cart</h4>
                <p>{error}</p>
                <button
                  className="buy__btn"
                  onClick={() => dispatch(fetchCart())}
                >
                  Try Again
                </button>
              </Col>
            </Row>
          </Container>
        </section>
      </Helmet>
    );
  }

  return (
    <Helmet title="Cart">
      <CommonSection title="Shopping Cart" />
      <section>
        <Container>
          <Row>
            <Col lg="9">
              {cartItems.length === 0 ? (
                <div className="text-center py-5">
                  <h2 className="fs-4">Your cart is empty</h2>
                  <p className="mt-3">
                    Add some products to your cart to see them here.
                  </p>
                  <Link to="/shop" className="buy__btn mt-3">
                    Continue Shopping
                  </Link>
                </div>
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
                  <span className="fs-4 fw-bold">
                    ${totalAmount ? parseFloat(totalAmount).toFixed(2) : "0.00"}
                  </span>
                </h6>
              </div>
              <p className="fs-6 mt-2">
                taxes and shipping will calculate in checkout
              </p>
              <div>
                <button
                  className="buy__btn w-100"
                  disabled={cartItems.length === 0}
                >
                  <Link to="/checkout">Proceed to Checkout</Link>
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
  const loading = useSelector((state) => state.cart.loading);

  // Extract product data from cart item
  const productName = item.productData?.name || item.productName;
  const variantName =
    item.productData?.variant?.name ||
    (item.variant ? item.variant.name : "Standard");
  const price = parseFloat(item.price).toFixed(2);

  // Process image URL from cart service
  let imageUrl;

  if (item.productData && item.productData.image) {
    // Case 1: Image from cart service's productData
    imageUrl = item.productData.image;

    // Handle JSON string if needed
    if (typeof imageUrl === "string" && imageUrl.startsWith("[")) {
      try {
        const parsedImages = JSON.parse(imageUrl);
        if (parsedImages && parsedImages.length > 0) {
          imageUrl = parsedImages[0];
        }
      } catch (err) {
        // Not valid JSON, keep as is
      }
    }
  } else if (item.imgUrl) {
    // Case 2: Image from local cart state
    imageUrl = item.imgUrl;
  } else {
    // Case 3: No image found
    imageUrl = "/placeholder.png";
  }

  // Ensure image URL has proper format
  if (
    imageUrl &&
    !imageUrl.startsWith("http") &&
    !imageUrl.startsWith("/placeholder")
  ) {
    // Handle uploads path
    if (imageUrl.startsWith("/uploads/")) {
      // Already has uploads prefix, use as is
      imageUrl = imageUrl;
    } else if (imageUrl.startsWith("/products/")) {
      imageUrl = `/uploads${imageUrl}`;
    } else {
      // Add appropriate prefix based on if it already has a leading slash
      imageUrl = imageUrl.startsWith("/")
        ? `/uploads${imageUrl}`
        : `/uploads/products/${imageUrl}`;
    }
  }

  const handleDeleteItem = () => {
    dispatch(removeCartItem(item.id))
      .unwrap()
      .then(() => {
        toast.success("Item removed from cart");
      })
      .catch((error) => {
        toast.error(error.message || "Failed to remove item");
      });
  };

  const incrementQuantity = () => {
    dispatch(
      updateCartItemQuantity({
        itemId: item.id,
        quantity: item.quantity + 1,
      })
    )
      .unwrap()
      .catch((error) => {
        toast.error(error.message || "Failed to update quantity");
      });
  };

  const decrementQuantity = () => {
    if (item.quantity > 1) {
      dispatch(
        updateCartItemQuantity({
          itemId: item.id,
          quantity: item.quantity - 1,
        })
      )
        .unwrap()
        .catch((error) => {
          toast.error(error.message || "Failed to update quantity");
        });
    }
  };

  return (
    <tr>
      <td>
        <img
          src={imageUrl}
          alt={item.productName}
          style={{
            width: "80px",
            height: "80px",
            objectFit: "contain",
            border: "1px solid #eee",
            borderRadius: "4px",
          }}
          onError={(e) => {
            e.target.src = "/placeholder.png";
          }}
        />
      </td>
      <td>{item.productName}</td>
      <td>{item.variant ? item.variant.name : "Standard"}</td>
      <td>${price}</td>
      <td>
        <div className="quantity-control d-flex align-items-center gap-2">
          <motion.span
            whileTap={{ scale: 1.2 }}
            onClick={decrementQuantity}
            className="decrease"
            style={{
              cursor: item.quantity > 1 ? "pointer" : "not-allowed",
              opacity: item.quantity > 1 ? 1 : 0.5,
            }}
            disabled={loading || item.quantity <= 1}
          >
            <i className="ri-subtract-line"></i>
          </motion.span>
          <span>{item.quantity}</span>
          <motion.span
            whileTap={{ scale: 1.2 }}
            onClick={incrementQuantity}
            className="increase"
            style={{ cursor: "pointer" }}
            disabled={loading}
          >
            <i className="ri-add-line"></i>
          </motion.span>
        </div>
      </td>
      <td>
        <motion.i
          whileTap={{ scale: 1.2 }}
          onClick={handleDeleteItem}
          className="ri-delete-bin-6-line"
          style={{ cursor: "pointer" }}
          disabled={loading}
        ></motion.i>
      </td>
    </tr>
  );
};

export default Cart;
