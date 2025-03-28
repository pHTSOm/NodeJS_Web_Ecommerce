import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";
import "../styles/auth.css";
import Helmet from "../components/Helmet/Helmet";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (AuthService.isLoggedIn()) {
      navigate("/");
    }
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      await AuthService.register({ name, email, password });
      setLoading(false);
      
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Helmet title="Register">
      <section className="auth-section">
        <Container>
          <Row>
            <Col lg="6" className="m-auto">
              <div className="auth-form">
                <h3 className="text-center">Create Account</h3>
                
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Register"}
                  </button>
                  
                  <p>
                    Already have an account? <Link to="/login">Login</Link>
                  </p>
                </form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default Register;