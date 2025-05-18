// frontend/src/pages/AuthSuccess.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Spinner } from "reactstrap";
import { useDispatch } from "react-redux";
import { syncCartAfterLogin } from "../slices/cartSlice";
import { toast } from "react-toastify";
import Helmet from "../components/Helmet/Helmet";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  useEffect(() => {
    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userParam = params.get('user');
        
        if (!token || !userParam) {
          throw new Error("Missing authentication data");
        }
        
        // Decode user data from base64
        const decodedUserParam = decodeURIComponent(userParam);
        let user;
        try {
          const userJson = atob(decodedUserParam);
          user = JSON.parse(userJson);
        } catch (decodeError) {
          console.error('Error decoding user data:', decodeError);
          const userBuffer = Buffer.from(decodedUserParam, 'base64');
          user = JSON.parse(userBuffer.toString());
        }
        
        // Save token and user data to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Show appropriate success message
        if (user.isNewUser) {
          toast.success("Account created successfully! Check your email for your password.");
        } else {
          toast.success("Authentication successful!");
        }
        
        // Sync cart with user account
        try {
          await dispatch(syncCartAfterLogin()).unwrap();
        } catch (error) {
          console.error('Failed to sync cart:', error);
        }
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate("/admin/products");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error('Error processing authentication:', error);
        toast.error("Authentication failed: " + (error.message || "Unknown error"));
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };
    
    handleAuth();
  }, [location, dispatch, navigate]);

  return (
    <Helmet title="Authentication Successful">
      <Container>
        <Row className="justify-content-center">
          <Col md="6" className="text-center py-5">
            <Spinner color="primary" />
            <h3 className="mt-4">Authentication Successful</h3>
            <p>Please wait while we redirect you...</p>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default AuthSuccess;