import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Alert,
  Card,
  CardBody,
  Badge,
} from "reactstrap";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../slices/cartSlice";
import { AuthService, OrderService, CartService } from "../services/api";
import "../styles/checkout.css";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);

  // States
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [verifyingDiscount, setVerifyingDiscount] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [error, setError] = useState("");
  const [processingOrder, setProcessingOrder] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    postalCode: "",
    country: "Vietnam",
    paymentMethod: "cod", // Default to cash on delivery
  });

  // Check if user is logged in and get their addresses
  useEffect(() => {
    const loggedIn = AuthService.isLoggedIn();
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      fetchUserData();
    }
  }, []);

  // Fetch user addresses and profile data
  const fetchUserData = async () => {
    setAddressesLoading(true);

    try {
      // Get user's saved addresses
      const addressResponse = await AuthService.getAddresses();
      if (addressResponse.success) {
        setAddresses(addressResponse.addresses || []);

        // Set default address if available
        const defaultAddress = addressResponse.addresses.find(
          (addr) => addr.isDefault
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          populateAddressForm(defaultAddress);
        }
      }

      // Get user's loyalty points
      const profileResponse = await AuthService.getUserProfile();
      if (profileResponse.success && profileResponse.user) {
        setLoyaltyPoints(profileResponse.user.loyaltyPoints || 0);

        setFormData((prev) => ({
          ...prev,
          email: profileResponse.user.email || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error("Failed to load your saved addresses");
    } finally {
      setAddressesLoading(false);
    }
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.info("Your cart is empty");
      navigate("/shop");
    }
  }, [cartItems, navigate]);

  // Handle address selection
  const handleAddressChange = (addressId) => {
    setSelectedAddressId(addressId);

    if (addressId) {
      const selectedAddress = addresses.find(
        (addr) => addr.id.toString() === addressId.toString()
      );
      if (selectedAddress) {
        populateAddressForm(selectedAddress);
      }
    } else {
      // Clear address fields if "Enter new address" is selected
      setFormData({
        ...formData,
        name: formData.name, // Keep the name and email
        email: formData.email,
        address: "",
        city: "",
        postalCode: "",
        country: "Vietnam",
        phone: "",
      });
    }

    // Clear any previous form errors
    setFormErrors({});
  };

  // Populate form with selected address
  const populateAddressForm = (address) => {
    setFormData({
      ...formData,
      name: address.name,
      address:
        address.addressLine1 +
        (address.addressLine2 ? ", " + address.addressLine2 : ""),
      city: address.city,
      postalCode: address.postalCode,
      country: address.country || "Vietnam",
      phone: address.phone,
    });
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!isLoggedIn && !formData.email.trim())
      errors.email = "Email is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.postalCode.trim())
      errors.postalCode = "Postal code is required";

    // Basic phone validation
    if (
      formData.phone &&
      !/^\+?[0-9\s-()]{10,15}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      errors.phone = "Please enter a valid phone number";
    }

    // Basic email validation
    if (
      !isLoggedIn &&
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Handle discount code verification
  const verifyDiscountCode = async () => {
    if (!discountCode) return;

    setVerifyingDiscount(true);

    try {
      // Here you would call your discount verification API
      // For now, let's simulate an API call with a timeout
      setTimeout(() => {
        // Implement actual call when API is ready
        // const response = await OrderService.verifyDiscountCode(discountCode);
        // if (response.success) {
        //   setDiscount(response.discountAmount);
        //   toast.success(`Discount code applied: ${response.discountAmount} off`);
        // } else {
        //   toast.error(response.message || "Invalid discount code");
        // }

        // Simulated response - replace with actual API call
        setDiscount(15); // 15% discount
        toast.success("Discount code applied: 15% off");

        setVerifyingDiscount(false);
      }, 500);
    } catch (error) {
      console.error("Error verifying discount code:", error);
      toast.error("Failed to verify discount code");
      setVerifyingDiscount(false);
    }
  };

  useEffect(() => {
    // Reset points usage when points balance changes
    if (loyaltyPoints < 100) {
      setUseLoyaltyPoints(false);
      setLoyaltyPointsUsed(0);
    }
  }, [loyaltyPoints]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = totalAmount || 0;
    const shippingFee = 10;
    const discountAmount = (subtotal * discount) / 100;
    const pointsDiscount = useLoyaltyPoints ? loyaltyPointsUsed / 100 : 0;
    const total = subtotal + shippingFee - discountAmount - pointsDiscount;

    return {
      subtotal: subtotal.toFixed(2),
      shipping: shippingFee.toFixed(2),
      discount: discountAmount.toFixed(2),
      points: pointsDiscount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Handle checkout submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      setError("Please correct the errors in the form");
      return;
    }

    setProcessingOrder(true);
    setError("");

    try {
      // Get cart items from Redux store
      const items = cartItems.map((item) => ({
        productId: item.productId || item.id,
        variantId: item.variantId || (item.variant ? item.variant.id : null),
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order data object
      const orderData = {
        items,
        shipping: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          state: formData.state,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        payment: {
          method: formData.paymentMethod,
        },
        discountCode: discount > 0 ? discountCode : null,
        useLoyaltyPoints: useLoyaltyPoints,
      };

      // Call OrderService to create order
      const response = await OrderService.createOrder(orderData);

      if (response.success) {
        // Clear the cart
        dispatch(clearCart());

        // Get the order ID from the response
        const orderId = response.order?.id;

        if (orderId) {
          // Redirect to order confirmation page
          navigate(`/order-confirmation/${orderId}`);
        } else {
          // Fallback if we can't get the order ID
          toast.success("Order placed successfully!");
          navigate("/");
        }
      } else {
        throw new Error(response.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setError(`Error: ${error.message || "An unknown error occurred"}`);
      toast.error("Failed to place order");
    } finally {
      setProcessingOrder(false);
    }
  };

  // Navigate to profile page to add a new address
  const navigateToAddAddress = () => {
    navigate("/profile");
  };

  // Update the points display calculation:
  const pointsToCurrency = (points) => (points / 100).toFixed(2);

  return (
    <Helmet title="Checkout">
      <CommonSection title="Checkout" />
      <section className="py-5">
        <Container>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              {/* Shipping Information */}
              <Col lg="8">
                <div className="checkout-form-container">
                  <h4 className="mb-4">Shipping Information</h4>

                  {/* Address selection for logged in users */}
                  {isLoggedIn && (
                    <div className="mb-4">
                      <Label className="mb-3 fw-bold">
                        Choose delivery address
                      </Label>

                      {addressesLoading ? (
                        <div className="text-center p-4 bg-light rounded">
                          <Spinner color="primary" size="sm" className="me-2" />
                          <span>Loading your addresses...</span>
                        </div>
                      ) : addresses.length > 0 ? (
                        <>
                          <div className="address-cards mb-3">
                            <Row>
                              {/* New address card option */}
                              <Col md="6" lg="4" className="mb-3">
                                <Card
                                  onClick={() => handleAddressChange("")}
                                  className={`h-100 address-card border ${
                                    selectedAddressId === ""
                                      ? "border-primary"
                                      : ""
                                  }`}
                                  style={{ cursor: "pointer" }}
                                >
                                  <CardBody className="d-flex flex-column justify-content-center align-items-center text-center p-3">
                                    <div className="mb-3">
                                      <i className="ri-add-circle-line fs-2"></i>
                                    </div>
                                    <h6>Enter a new address</h6>
                                  </CardBody>
                                </Card>
                              </Col>

                              {/* Saved addresses */}
                              {addresses.map((address) => (
                                <Col
                                  md="6"
                                  lg="4"
                                  className="mb-3"
                                  key={address.id}
                                >
                                  <Card
                                    onClick={() =>
                                      handleAddressChange(address.id)
                                    }
                                    className={`h-100 address-card ${
                                      selectedAddressId === address.id
                                        ? "border border-primary"
                                        : ""
                                    }`}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <CardBody className="p-3">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{address.name}</h6>
                                        {address.isDefault && (
                                          <Badge color="primary" pill>
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="small mb-1">
                                        {address.addressLine1}
                                      </p>
                                      {address.addressLine2 && (
                                        <p className="small mb-1">
                                          {address.addressLine2}
                                        </p>
                                      )}
                                      <p className="small mb-1">
                                        {address.state}
                                      </p>
                                      <p className="small mb-1">
                                        {address.city}
                                      </p>
                                      <p className="small mb-1">
                                        {address.postalCode}
                                      </p>
                                      <p className="small mb-1">
                                        {address.country}
                                      </p>
                                      <p className="small mb-0">
                                        {address.phone}
                                      </p>
                                    </CardBody>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>

                          <div className="text-end">
                            <Button
                              color="outline-primary"
                              size="sm"
                              onClick={navigateToAddAddress}
                            >
                              <i className="ri-add-line me-1"></i> Add New
                              Address
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="mb-4 p-4 bg-light rounded text-center">
                          <p className="mb-2">
                            You don't have any saved addresses yet.
                          </p>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={navigateToAddAddress}
                          >
                            <i className="ri-add-line me-1"></i> Add Address
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="billing__form">
                    {(!isLoggedIn ||
                      selectedAddressId === "" ||
                      addresses.length === 0) && (
                      <>
                        <h5 className="mb-3">Enter shipping details</h5>

                        <Row>
                          <Col md="6" className="form__group mb-3">
                            <Label for="name">Full Name*</Label>
                            <Input
                              type="text"
                              name="name"
                              id="name"
                              placeholder="Enter your full name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              invalid={!!formErrors.name}
                            />
                            {formErrors.name && (
                              <div className="text-danger small mt-1">
                                {formErrors.name}
                              </div>
                            )}
                          </Col>

                          <Col md="6" className="form__group mb-3">
                            <Label for="email">
                              Email{!isLoggedIn ? "*" : ""}
                            </Label>
                            <Input
                              type="email"
                              name="email"
                              id="email"
                              placeholder="Enter your email"
                              value={formData.email}
                              onChange={handleChange}
                              required={!isLoggedIn}
                              disabled={isLoggedIn}
                              invalid={!!formErrors.email}
                            />
                            {formErrors.email && (
                              <div className="text-danger small mt-1">
                                {formErrors.email}
                              </div>
                            )}
                          </Col>
                        </Row>

                        <Row>
                          <Col md="6" className="form__group mb-3">
                            <Label for="phone">Phone Number*</Label>
                            <Input
                              type="text"
                              name="phone"
                              id="phone"
                              placeholder="Enter your phone number"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              invalid={!!formErrors.phone}
                            />
                            {formErrors.phone && (
                              <div className="text-danger small mt-1">
                                {formErrors.phone}
                              </div>
                            )}
                          </Col>

                          <Col md="6" className="form__group mb-3">
                            <Label for="postalCode">Postal Code*</Label>
                            <Input
                              type="text"
                              name="postalCode"
                              id="postalCode"
                              placeholder="Enter postal code"
                              value={formData.postalCode}
                              onChange={handleChange}
                              required
                              invalid={!!formErrors.postalCode}
                            />
                            {formErrors.postalCode && (
                              <div className="text-danger small mt-1">
                                {formErrors.postalCode}
                              </div>
                            )}
                          </Col>
                        </Row>

                        <FormGroup className="mb-3">
                          <Label for="address">Address*</Label>
                          <Input
                            type="text"
                            name="address"
                            id="address"
                            placeholder="Enter your address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            invalid={!!formErrors.address}
                          />
                          {formErrors.address && (
                            <div className="text-danger small mt-1">
                              {formErrors.address}
                            </div>
                          )}
                        </FormGroup>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="state">State/Province*</Label>
                            <Input
                              type="text"
                              name="state"
                              id="state"
                              value={formData.state}
                              onChange={handleChange}
                              invalid={!!formErrors.state}
                              required
                            />
                            {formErrors.state && (
                              <div className="text-danger small mt-1">
                                {formErrors.state}
                              </div>
                            )}
                          </FormGroup>
                        </Col>

                        <Row>
                          <Col md="6" className="form__group mb-3">
                            <Label for="city">City*</Label>
                            <Input
                              type="text"
                              name="city"
                              id="city"
                              placeholder="Enter your city"
                              value={formData.city}
                              onChange={handleChange}
                              required
                              invalid={!!formErrors.city}
                            />
                            {formErrors.city && (
                              <div className="text-danger small mt-1">
                                {formErrors.city}
                              </div>
                            )}
                          </Col>

                          <Col md="6" className="form__group mb-3">
                            <Label for="country">Country*</Label>
                            <Input
                              type="text"
                              name="country"
                              id="country"
                              placeholder="Enter your country"
                              value={formData.country}
                              onChange={handleChange}
                              required
                            />
                          </Col>
                        </Row>
                      </>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="payment__method mt-5">
                    <h4 className="mb-4">Payment Method</h4>

                    <FormGroup check className="mb-3">
                      <Input
                        type="radio"
                        name="paymentMethod"
                        id="cod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleChange}
                      />
                      <Label
                        check
                        for="cod"
                        className="d-flex align-items-center"
                      >
                        <i className="ri-money-dollar-circle-line me-2 fs-5"></i>
                        <div>
                          <span className="fw-bold">Cash on Delivery</span>
                          <p className="mb-0 small text-muted">
                            Pay when your order arrives
                          </p>
                        </div>
                      </Label>
                    </FormGroup>

                    <FormGroup check className="mb-3">
                      <Input
                        type="radio"
                        name="paymentMethod"
                        id="card"
                        value="card"
                        checked={formData.paymentMethod === "card"}
                        onChange={handleChange}
                        disabled
                      />
                      <Label
                        check
                        for="card"
                        className="d-flex align-items-center"
                      >
                        <i className="ri-bank-card-line me-2 fs-5"></i>
                        <div>
                          <span className="fw-bold">Credit/Debit Card</span>
                          <p className="mb-0 small text-muted">Coming Soon</p>
                        </div>
                      </Label>
                    </FormGroup>
                  </div>
                </div>
              </Col>

              {/* Order Summary */}
              <Col lg="4">
                <div className="checkout__cart">
                  <h4 className="mb-4">Order Summary</h4>

                  {/* Cart items summary */}
                  <div className="cart-items-summary mb-4">
                    <h6 className="mb-3">Items in Cart ({cartItems.length})</h6>
                    {cartItems.map((item, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between mb-2"
                      >
                        <span
                          className="text-truncate"
                          style={{ maxWidth: "70%" }}
                        >
                          {item.productName || item.name} × {item.quantity}
                          {item.variant && (
                            <small className="ms-1 text-muted">
                              ({item.variant.name})
                            </small>
                          )}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Discount Code */}
                  <div className="mb-4">
                    <Label for="discountCode">Discount Code</Label>
                    <div className="d-flex">
                      <Input
                        type="text"
                        name="discountCode"
                        id="discountCode"
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="me-2"
                      />
                      <Button
                        color="primary"
                        onClick={verifyDiscountCode}
                        disabled={verifyingDiscount || !discountCode}
                      >
                        {verifyingDiscount ? <Spinner size="sm" /> : "Apply"}
                      </Button>
                    </div>
                    {discount > 0 && (
                      <div className="mt-2 text-success small">
                        <i className="ri-check-line me-1"></i>
                        Discount code applied: {discount}% off
                      </div>
                    )}
                  </div>

                  {/* Loyalty Points */}
                  {isLoggedIn && loyaltyPoints > 0 && (
                    <FormGroup check className="mb-4">
                      <Input
                        type="checkbox"
                        id="useLoyaltyPoints"
                        checked={useLoyaltyPoints}
                        onChange={(e) => {
                          const wantToUse = e.target.checked;
                          if (wantToUse) {
                            if (loyaltyPoints < 100) {
                              toast.error(
                                "You need at least 100 points to redeem"
                              );
                              return;
                            }
                            const usablePoints =
                              Math.floor(loyaltyPoints / 100) * 100;
                            setLoyaltyPointsUsed(usablePoints);
                          } else {
                            setLoyaltyPointsUsed(0);
                          }
                          setUseLoyaltyPoints(wantToUse);
                        }}
                      />
                      <Label
                        check
                        for="useLoyaltyPoints"
                        className="d-flex justify-content-between w-100"
                      >
                        <span>
                          Use Loyalty Points (Available: {loyaltyPoints} pts)
                          {useLoyaltyPoints &&
                            ` (Using: ${loyaltyPointsUsed} pts)`}
                        </span>
                        {useLoyaltyPoints && (
                          <span className="text-success">
                            -${pointsToCurrency(loyaltyPointsUsed)}
                          </span>
                        )}
                      </Label>
                    </FormGroup>
                  )}

                  {/* Totals */}
                  <div className="order-totals">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal}</span>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <span>Shipping:</span>
                      <span>${totals.shipping}</span>
                    </div>

                    {discount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Discount ({discount}%):</span>
                        <span>-${totals.discount}</span>
                      </div>
                    )}

                    {useLoyaltyPoints && loyaltyPoints > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Loyalty Points:</span>
                        <span>-${totals.points}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-3 pt-3 border-top fw-bold">
                      <span>Total:</span>
                      <span className="fs-5">${totals.total}</span>
                    </div>
                  </div>

                  <Button
                    color="primary"
                    type="submit"
                    className="buy__btn w-100 mt-4"
                    disabled={processingOrder}
                    size="lg"
                  >
                    {processingOrder ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Processing
                        Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>

                  <div className="text-center mt-3">
                    <Link to="/cart" className="text-decoration-none">
                      <i className="ri-arrow-left-line me-1"></i> Return to Cart
                    </Link>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </Container>
      </section>
    </Helmet>
  );
};

export default Checkout;
