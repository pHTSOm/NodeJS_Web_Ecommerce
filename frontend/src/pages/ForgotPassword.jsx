// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Button, Alert } from "reactstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";
import "../styles/auth.css";
import Helmet from "../components/Helmet/Helmet";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AuthService.forgotPassword({ email });
      
      if (response.success) {
        setSuccess(true);
        toast.success("Password reset email sent successfully");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Helmet title="Forgot Password">
      <section className="auth-section">
        <Container>
          <Row>
            <Col lg="6" className="m-auto">
              <div className="auth-form">
                <h3 className="text-center">Forgot Password</h3>
                
                {success ? (
                  <Alert color="success" className="mt-4">
                    <h5 className="mb-2">Email Sent</h5>
                    <p>
                      We've sent a password reset email to <strong>{email}</strong>. 
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <p className="mb-0">
                      Remember to check your spam or junk folder if you don't see the email in your inbox.
                    </p>
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <FormGroup>
                      <p className="text-muted mb-4">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </FormGroup>
                    
                    <Button
                      type="submit"
                      className="auth-btn"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    
                    <p className="mt-3 text-center">
                      <Link to="/login">Back to Login</Link>
                    </p>
                  </Form>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default ForgotPassword;