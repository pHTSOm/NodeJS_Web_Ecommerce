import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthService } from "../services/api";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure auth state is updated
    setTimeout(() => {
      const isLoggedIn = AuthService.isLoggedIn();
      const isAdmin = AuthService.isAdmin();
      
      setIsAuthorized(adminOnly ? (isLoggedIn && isAdmin) : isLoggedIn);
      setAuthChecked(true);
    }, 100);
  }, [adminOnly]);
  
  // Show loading or nothing while checking
  if (!authChecked) return null;
  
  // After checking, either redirect or show children
  if (!isAuthorized) {
    return <Navigate to={adminOnly ? "/" : "/login"} replace />;
  }
  
  return children;
};

export default ProtectedRoute;