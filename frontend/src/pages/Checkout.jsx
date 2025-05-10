import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Spinner, Alert } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../slices/cartSlice";
import { AuthService, OrderService, CartService } from "../services/api";
import "../styles/checkout.css";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";


const debugResponse = (response) => {
  console.log("Full API response:", response);
  console.log("Response type:", typeof response);
  console.log("Has success property:", response && typeof response.success !== 'undefined');
  console.log("Has order property:", response && typeof response.order !== 'undefined');
  
  if (response && response.order) {
    console.log("Order properties:", Object.keys(response.order));
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [verifyingDiscount, setVerifyingDiscount] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  
  // Add the missing state declarations
  const [error, setError] = useState("");
  const [processingOrder, setProcessingOrder] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Vietnam",
    paymentMethod: "cod" // Default to cash on delivery
  });

  // Check if user is logged in and get their addresses
  useEffect(() => {
    const loggedIn = AuthService.isLoggedIn();
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      // Get user's saved addresses
      const fetchAddresses = async () => {
        try {
          const response = await AuthService.getAddresses();
          if (response.success) {
            setAddresses(response.addresses || []);
            
            // Set default address if available
            const defaultAddress = response.addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              populateAddressForm(defaultAddress);
            }
          }
        } catch (error) {
          console.error("Failed to fetch addresses:", error);
        }
      };

      // Get user's loyalty points
      const fetchUserProfile = async () => {
        try {
          const response = await AuthService.getUserProfile();
          if (response.success && response.user) {
            setLoyaltyPoints(response.user.loyaltyPoints || 0);

            setFormData(prev => ({
              ...prev,
              email: response.user.email || ""
            }));
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      };

      fetchAddresses();
      fetchUserProfile();
    }
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.info("Your cart is empty");
      navigate("/shop");
    }
  }, [cartItems, navigate]);

  // Handle address selection
  const handleAddressChange = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    
    if (addressId) {
      const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
      if (selectedAddress) {
        populateAddressForm(selectedAddress);
      }
    }
  };

  // Populate form with selected address
  const populateAddressForm = (address) => {
    setFormData({
      ...formData,
      name: address.name,
      address: address.addressLine1 + (address.addressLine2 ? ", " + address.addressLine2 : ""),
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone
    });
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
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

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = totalAmount || 0;
    const shippingFee = 10; // Fixed shipping fee
    const discountAmount = (subtotal * discount) / 100;
    const pointsDiscount = useLoyaltyPoints ? Math.min(loyaltyPoints, subtotal) : 0;
    const total = subtotal + shippingFee - discountAmount - pointsDiscount;
    
    return {
      subtotal: subtotal.toFixed(2),
      shipping: shippingFee.toFixed(2),
      discount: discountAmount.toFixed(2),
      points: pointsDiscount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Handle checkout submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
  
    // Basic validation
    if (!formData.name || (!isLoggedIn && !formData.email) || !formData.phone || !formData.address) {
      setError("Please fill all required fields");
      toast.error("Please fill all required fields");
      return;
    }
  
    setProcessingOrder(true);
    setError("");
    
    console.log("Processing order with data:", formData);
  
    try {
      // Get cart items from Redux store
      const items = cartItems.map(item => ({
        productId: item.productId || item.id,
        variantId: item.variantId || (item.variant ? item.variant.id : null),
        quantity: item.quantity,
        price: item.price
      }));
      
      // Create order data object
      const orderData = {
        items,
        shipping: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        },
        payment: {
          method: formData.paymentMethod
        },
        discountCode: discount > 0 ? discountCode : null,
        useLoyaltyPoints: useLoyaltyPoints
      };
      
      console.log("Submitting order:", JSON.stringify(orderData));
      
      // Call OrderService to create order
      const response = await OrderService.createOrder(orderData);
      console.log("Order creation response:", response);
      
      if (response.success) {
        // Clear the cart
        dispatch(clearCart());
        
        // Get the order ID from the response
        const orderId = response.order?.id;
        
        if (orderId) {
          // Redirect to order confirmation page
          navigate(`/order-confirmation/${orderId}`);
        } else {
          console.log("Could not determine order ID from response:", response);
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

  return (
    <Helmet title="Checkout">
      <CommonSection title="Checkout" />
      <section>
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
                <h4 className="mb-4">Shipping Information</h4>
                
                {/* Address selection for logged in users */}
                {isLoggedIn && addresses.length > 0 && (
                  <FormGroup className="mb-4">
                    <Label for="addressSelect">Select a saved address</Label>
                    <Input
                      type="select"
                      id="addressSelect"
                      value={selectedAddressId}
                      onChange={handleAddressChange}
                    >
                      <option value="">-- Enter a new address --</option>
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.name} - {addr.addressLine1}, {addr.city}
                          {addr.isDefault ? " (Default)" : ""}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                )}
                
                <div className="billing__form">
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
                      />
                    </Col>
                    
                    <Col md="6" className="form__group mb-3">
                      <Label for="email">Email</Label>
                      <Input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required={!isLoggedIn}
                        disabled={isLoggedIn}
                      />
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
                      />
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
                      />
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
                    />
                  </FormGroup>
                  
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
                      />
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
                    <Label check for="cod">
                      Cash on Delivery
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
                    />
                    <Label check for="card">
                      Credit/Debit Card (Coming Soon)
                    </Label>
                  </FormGroup>
                  
                  {formData.paymentMethod === "card" && (
                    <div className="mt-3 mb-4 p-3 bg-light rounded">
                      <p className="mb-0 text-muted">
                        Credit card payment is not yet implemented. Please select Cash on Delivery.
                      </p>
                    </div>
                  )}
                </div>
              </Col>
              
              {/* Order Summary */}
              <Col lg="4">
                <div className="checkout__cart">
                  <h4 className="mb-4">Order Summary</h4>
                  
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
                  </div>
                  
                  {/* Loyalty Points */}
                  {isLoggedIn && loyaltyPoints > 0 && (
                    <FormGroup check className="mb-4">
                      <Input
                        type="checkbox"
                        id="useLoyaltyPoints"
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      />
                      <Label check for="useLoyaltyPoints">
                        Use {loyaltyPoints.toFixed(2)} loyalty points
                      </Label>
                    </FormGroup>
                  )}
                  
                  <h6>
                    Subtotal: <span>${totals.subtotal}</span>
                  </h6>
                  
                  <h6>
                    Shipping: <span>${totals.shipping}</span>
                  </h6>
                  
                  {discount > 0 && (
                    <h6>
                      Discount ({discount}%): <span>-${totals.discount}</span>
                    </h6>
                  )}
                  
                  {useLoyaltyPoints && loyaltyPoints > 0 && (
                    <h6>
                      Loyalty Points: <span>-${totals.points}</span>
                    </h6>
                  )}
                  
                  <h4>
                    Total: <span>${totals.total}</span>
                  </h4>
                  
                  <Button
                    color="primary"
                    type="submit"
                    className="buy__btn w-100 mt-4"
                    disabled={processingOrder}
                  >
                    {processingOrder ? (
                      <>
                        <Spinner size="sm" /> Processing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
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