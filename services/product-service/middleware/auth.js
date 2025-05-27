// services/product-service/middleware/auth.js
const jwt = require("jsonwebtoken");
const axios = require("axios");

exports.protect = async (req, res, next) => {
  try {
    console.log('[Product Service] protect middleware called');
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log('[Product Service] Token extracted:', token ? 'YES' : 'NO');
    }

    if (!token) {
      console.log('[Product Service] No token provided');
      return res.status(401).json({
        success: false,
        message: "Not authorized - no token",
      });
    }

    // Verify token locally first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      console.log('[Product Service] Token verified, user ID:', req.userId);
      next();
    } catch (error) {
      console.error('[Product Service] Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }    
  } catch (error) {
    console.error("[Product Service] Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

exports.optionalProtect = async (req, res, next) => {
  try {
    console.log('[Product Service] optionalProtect middleware called');
    console.log('[Product Service] Authorization header:', req.headers.authorization ? 'Present' : 'Not present');
    
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      try {
        // Verify token and set user ID properly
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        console.log('[Product Service] User authenticated:', req.userId);
      } catch (error) {
        console.log('[Product Service] Token verification failed:', error.message);
        req.userId = null;
      }
    } else {
      console.log('[Product Service] No authorization header found');
      req.userId = null;
    }
    console.log('[Product Service] User ID after processing:', req.userId);
    next();
  } catch (error) {
    console.error("[Product Service] Error in optionalProtect middleware:", error);
    req.userId = null;
    next();
  }
};

exports.adminOnly = async (req, res, next) => {
  try {
    console.log('[Product Service] adminOnly middleware called');
    console.log('[Product Service] User ID from req:', req.userId);
    console.log('[Product Service] Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - no token",
      });
    }

    // Make an API call to user service to check admin status
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:3001";

    try {
      console.log('[Product Service] Calling user service check-role...');
      const response = await axios.get(
        `${userServiceUrl}/api/users/check-role`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
          timeout: 5000, // Add timeout to prevent hanging requests
        }
      );

      console.log('[Product Service] User service response:', response.data);

      // Check if user is admin
      if (response.data && response.data.success && response.data.role === "admin") {
        console.log('[Product Service] Admin access granted');
        next();
      } else {
        console.log('[Product Service] Admin access denied - role:', response.data?.role);
        return res.status(403).json({
          success: false,
          message: "Not authorized - admin access required",
        });
      }
    } catch (error) {
      console.error('[Product Service] User service call failed:', error.message);
      
      let errorMessage = "Authentication service unavailable";
      let statusCode = 500;

      if (error.code === "ECONNREFUSED") {
        console.error("[Product Service] User service is down or unreachable");
        statusCode = 503; // Service Unavailable
      } else if (error.response) {
        console.error("[Product Service] User service error response:", error.response.data);
        statusCode = error.response.status;
        errorMessage = error.response.data?.message || "Authentication error";
      } else {
        console.error("[Product Service] Admin check error:", error.message);
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        debug: {
          userServiceUrl,
          hasAuth: !!req.headers.authorization,
          errorCode: error.code,
          errorMessage: error.message
        }
      });
    }
  } catch (error) {
    console.error("[Product Service] Admin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};