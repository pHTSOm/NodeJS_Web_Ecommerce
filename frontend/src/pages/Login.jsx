// frontend/src/pages/Login.jsx - Complete implementation
import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";
import { useDispatch } from "react-redux";
import { syncCartAfterLogin } from "../slices/cartSlice";
import "../styles/auth.css";
import Helmet from "../components/Helmet/Helmet";
import GoogleAuthButton from "../components/UI/GoogleAuthButton";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Check if there's a redirect path in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    
    if (error) {
      toast.error(error.replace(/_/g, ' '));
    }
  }, [location]);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (AuthService.isLoggedIn()) {
      navigate("/");
    }
  }, [navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AuthService.login({ email, password });
      setLoading(false);
      toast.success("Login successful");
      
      // Dispatch cart sync action and handle redirection
      handleLoginSuccess();
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const handleLoginSuccess = () => {
    // After successful login, sync cart
    dispatch(syncCartAfterLogin())
      .unwrap()
      .then(() => {
        // Redirect user based on role
        if (AuthService.isAdmin()) {
          navigate("/admin/products");
        } else {
          // Get redirect path from query params if exists
          const searchParams = new URLSearchParams(location.search);
          const redirectPath = searchParams.get('redirect');
          navigate(redirectPath || '/');
        }      
      })
      .catch((error) => {
        console.error('Failed to sync cart:', error);
        // Still redirect, even if cart sync fails
        if (AuthService.isAdmin()) {
          navigate("/admin/products");
        } else {
          const searchParams = new URLSearchParams(location.search);
          const redirectPath = searchParams.get('redirect');
          navigate(redirectPath || '/');
        }
      });
  };

  return (
    <Helmet title="Login">
      <section className="auth-section">
        <Container>
          <Row>
            <Col lg="6" className="m-auto">
              <div className="auth-form">
                <h3 className="text-center">Login</h3>
                <GoogleAuthButton />
                <div className="text-center my-3">
                  <span className="text-muted">OR</span>
                </div>
                <form onSubmit={handleLogin}>
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="text-end mb-3">
                    <Link to="/forgot-password" className="text-decoration-none">
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  
                  <p className="mt-3 text-center">
                    Don't have an account? <Link to="/register">Create an account</Link>
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

export default Login;