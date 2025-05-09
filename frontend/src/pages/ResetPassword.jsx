// frontend/src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Button, Alert } from "reactstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";
import "../styles/auth.css";
import Helmet from "../components/Helmet/Helmet";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid or missing reset token");
    }
  }, [location]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await AuthService.resetPassword({
        token,
        newPassword
      });
      
      if (response.success) {
        setSuccess(true);
        toast.success("Password reset successful");
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.response?.data?.message || "Failed to reset password. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };
  
  // If token is missing, show error
  if (error) {
    return (
      <Helmet title="Reset Password">
        <section className="auth-section">
          <Container>
            <Row>
              <Col lg="6" className="m-auto">
                <div className="auth-form">
                  <h3 className="text-center">Reset Password</h3>
                  
                  <Alert color="danger" className="mt-4">
                    <h5 className="mb-2">Error</h5>
                    <p className="mb-0">{error}</p>
                  </Alert>
                  
                  <div className="text-center mt-4">
                    <Link to="/forgot-password" className="btn auth-btn">
                      Return to Forgot Password
                    </Link>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </Helmet>
    );
  }
  
  // If password reset was successful, show success message
  if (success) {
    return (
      <Helmet title="Reset Password">
        <section className="auth-section">
          <Container>
            <Row>
              <Col lg="6" className="m-auto">
                <div className="auth-form">
                  <h3 className="text-center">Reset Password</h3>
                  
                  <Alert color="success" className="mt-4">
                    <h5 className="mb-2">Password Reset Successful</h5>
                    <p className="mb-0">
                      Your password has been reset successfully. You will be redirected to the login page shortly.
                    </p>
                  </Alert>
                  
                  <div className="text-center mt-4">
                    <Link to="/login" className="btn auth-btn">
                      Go to Login
                    </Link>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </Helmet>
    );
  }
  
  return (
    <Helmet title="Reset Password">
      <section className="auth-section">
        <Container>
          <Row>
            <Col lg="6" className="m-auto">
              <div className="auth-form">
                <h3 className="text-center">Reset Password</h3>
                
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    <small className="text-muted">
                      Password must be at least 6 characters long
                    </small>
                  </FormGroup>
                  
                  <FormGroup>
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </FormGroup>
                  
                  <Button
                    type="submit"
                    className="auth-btn"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                  
                  <p className="mt-3 text-center">
                    <Link to="/login">Back to Login</Link>
                  </p>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default ResetPassword;