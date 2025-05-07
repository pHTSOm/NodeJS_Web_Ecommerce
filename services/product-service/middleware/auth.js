const jwt = require("jsonwebtoken");
const axios = require("axios");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - no token",
      });
    }

    // Verify token
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // In a microservice, we don't have direct access to User model
    // So we just pass the user ID from the token
    req.userId = decoded.id;
    next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
    }    
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

exports.optionalProtect = async (req, res, next) => {
  try {
    console.log('optionalProtect middleware called');
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Not present');
    
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      try {
        // Verify token and set user ID properly
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        console.log('User authenticated:', req.userId);
      } catch (error) {
        console.log('Token verification failed:', error.message);
        req.userId = null;
      }
    } else {
      console.log('No authorization header found');
      req.userId = null;
    }
    console.log('User ID after processing:', req.userId);
    next();
  } catch (error) {
    console.error("Error in optionalProtect middleware:", error);
    req.userId = null;
    next();
  }
};

exports.adminOnly = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - no token",
      });
    }

    // Make an API call to user service to check admin status
    const userServiceUrl =
      process.env.USER_SERVICE_URL || "http://user-service:3001";

    try {
      const response = await axios.get(
        `${userServiceUrl}/api/users/check-role`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
          timeout: 5000, // Add timeout to prevent hanging requests
        }
      );

      // Check if user is admin
      if (response.data && response.data.role === "admin") {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: "Not authorized - admin access required",
        });
      }
    } catch (error) {
      let errorMessage = "Authentication service unavailable";
      let statusCode = 500;

      if (error.code === "ECONNREFUSED") {
        console.error("User service is down or unreachable");
        statusCode = 503; // Service Unavailable
      } else if (error.response) {
        console.error("User service error:", error.response.data);
        statusCode = error.response.status;
        errorMessage = error.response.data.message || "Authentication error";
      } else {
        console.error("Admin check error:", error.message);
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
