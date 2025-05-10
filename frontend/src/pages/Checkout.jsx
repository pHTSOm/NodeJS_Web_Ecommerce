import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import "../styles/checkout.css";
import { toast } from "react-toastify";
import { clearCart } from "../slices/cartSlice";

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Vietnam",
  });
  const [processingOrder, setProcessingOrder] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
  
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.addressLine1) {
      setError("Please fill all required fields");
      toast.error("Please fill all required fields");
      return;
    }
  
    setProcessingOrder(true);
    setError("");
    
    console.log("Processing order with data:", formData);
  
    try {
      // Create order data object
      const orderData = {
        email: formData.email,
        shippingAddress: {
          name: formData.name,
          addressLine1: formData.addressLine1,
          addressLine2: '',
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone
        },
        paymentMethod: 'credit_card', // default payment method
        notes: ''
      };
      
      console.log("Calling direct place order with data:", orderData);
      
      // Try direct API call
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Include authorization header if user is logged in
            ...(localStorage.getItem('token') ? {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            } : {})
          },
          body: JSON.stringify(orderData),
          credentials: 'include' // Important for cookies
        });
        
        const result = await response.json();
        console.log("API response:", result);
        
        if (result.success) {
          console.log("Order placed successfully:", result);
          toast.success("Order placed successfully!");
          
          // Clear the cart
          dispatch(clearCart());
          
          // Check the result structure carefully
          const orderId = result.order?.id || result.orderId || Date.now(); // Fallback if id is missing
          navigate(`/order-confirmation/${orderId}`);
          return;
        } else {
          throw new Error(result.message || "Failed to place order");
        }
      } catch (directApiError) {
        console.error("Direct API call failed:", directApiError);
        // Log detailed error info
        if (directApiError.response) {
          console.error("Response status:", directApiError.response.status);
          console.error("Response data:", directApiError.response.data);
        }
        throw directApiError; // Rethrow to be caught by outer catch
      }
      
    } catch (error) {
      console.error("Error placing order:", error);
      setError(`Error: ${error.message || "An unknown error occurred"}`);
      toast.error("Failed to place order");
      
      // Fallback to simulation for testing
      if (confirm("API call failed. Would you like to simulate a successful order for testing?")) {
        dispatch(clearCart());
        const fallbackOrderId = Date.now();
        navigate(`/order-confirmation/${fallbackOrderId}`);
      }
    } finally {
      setProcessingOrder(false);
    }
  };   

  return (
    <Helmet title="Checkout">
      <CommonSection title="Checkout" />
      <section>
        <Container>
          <Row>
            <Col lg="8">
              <h5 className="mb-4">Shipping Information</h5>
              
              {error && (
                <Alert color="danger" className="mb-4">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="name">Full Name</Label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="phone">Phone Number</Label>
                  <Input
                    type="text"
                    name="phone"
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="addressLine1">Street Address</Label>
                  <Input
                    type="text"
                    name="addressLine1"
                    id="addressLine1"
                    placeholder="Enter your street address"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <Row form>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="city">City</Label>
                      <Input
                        type="text"
                        name="city"
                        id="city"
                        placeholder="Enter your city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="state">State/Province</Label>
                      <Input
                        type="text"
                        name="state"
                        id="state"
                        placeholder="Enter your state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>
                
                <Row form>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="postalCode">Postal Code</Label>
                      <Input
                        type="text"
                        name="postalCode"
                        id="postalCode"
                        placeholder="Enter your postal code"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="country">Country</Label>
                      <Input
                        type="text"
                        name="country"
                        id="country"
                        placeholder="Enter your country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-end mt-5">
                  <Button
                    type="submit"
                    color="primary"
                    className="buy__btn"
                    disabled={processingOrder}
                  >
                    {processingOrder ? "Processing..." : "Place Order"}
                  </Button>
                </div>
              </Form>
            </Col>
            
            <Col lg="4">
              <div className="checkout__cart">
                <h6>
                  Order Summary
                  <span>({cartItems.length} items)</span>
                </h6>
                
                {cartItems.map((item, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                    <span style={{ fontSize: "0.9rem" }}>
                      {item.quantity}x {item.productName}
                      {item.variant && <small className="ms-1">({item.variant.name})</small>}
                    </span>
                    <span style={{ fontSize: "0.9rem" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                <h6>
                  Subtotal
                  <span>${totalAmount ? totalAmount.toFixed(2) : "0.00"}</span>
                </h6>
                
                <h6>
                  Shipping
                  <span>$10.00</span>
                </h6>
                
                <h6>
                  Tax (10%)
                  <span>${totalAmount ? (totalAmount * 0.1).toFixed(2) : "0.00"}</span>
                </h6>
                
                <h4>
                  Total
                  <span>${totalAmount ? (totalAmount + 10 + (totalAmount * 0.1)).toFixed(2) : "0.00"}</span>
                </h4>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};
const directPlaceOrder = async (orderData) => {
  try {
    console.log("Making direct API call to place order:", orderData);
    
    // Make a direct fetch call to your API
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include authorization header if user is logged in
        ...(localStorage.getItem('token') ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {})
      },
      body: JSON.stringify(orderData),
      credentials: 'include' // Important for cookies
    });
    
    const data = await response.json();
    console.log("API response:", data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place order');
    }
    
    return data;
  } catch (error) {
    console.error("Error in directPlaceOrder:", error);
    throw error;
  }
};

export default Checkout;