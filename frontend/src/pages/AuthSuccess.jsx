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
        
        console.log("Auth Success params:", { 
          token: token ? (token.substring(0, 10) + '...') : 'missing', 
          userParamExists: !!userParam 
        });
        
        if (!token || !userParam) {
          throw new Error("Missing authentication data");
        }
        
        // Decode base64 string and then parse as JSON
        // First URL decode in case there were any URL encoding applied during redirect
        const decodedUserParam = decodeURIComponent(userParam);
        
        // Then decode from base64
        let user;
        try {
          // For browsers
          const userJson = atob(decodedUserParam);
          user = JSON.parse(userJson);
        } catch (decodeError) {
          console.error('Error decoding user data:', decodeError);
          // Alternative decoding method
          const userBuffer = Buffer.from(decodedUserParam, 'base64');
          user = JSON.parse(userBuffer.toString());
        }
        
        console.log("Successfully decoded user:", { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        });
        
        // Save token and user data to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success("Authentication successful!");
        
        // Sync cart with user account
        try {
          await dispatch(syncCartAfterLogin()).unwrap();
        } catch (error) {
          console.error('Failed to sync cart:', error);
          // Continue even if cart sync fails
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
        
        // Instead of immediately redirecting, show error details for debugging
        console.error('Full error details:', error);
        console.error('Location search:', location.search);
        
        // Add a slight delay before redirecting to login for debugging
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