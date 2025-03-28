import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";
import "../styles/auth.css";
import Helmet from "../components/Helmet/Helmet";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

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
      await AuthService.login({ email, password });
      setLoading(false);
      toast.success("Login successful");
      
      setTimeout(() => {
    if (AuthService.isAdmin()) {
      navigate("/admin/products");
    } else {
      navigate("/");
    }
  }, 100);
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <Helmet title="Login">
      <section className="auth-section">
        <Container>
          <Row>
            <Col lg="6" className="m-auto">
              <div className="auth-form">
                <h3 className="text-center">Login</h3>
                
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
                  
                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  
                  <p>
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