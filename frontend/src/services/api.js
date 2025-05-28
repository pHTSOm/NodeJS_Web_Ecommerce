import axios from "axios";

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add auth token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add retry mechanism for network errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on network errors or 5xx responses
    if (
      !config ||
      !config.retry ||
      config.retry >= 3 ||
      (error.response && error.response.status < 500)
    ) {
      return Promise.reject(error);
    }

    // Set retry count
    config.retry = config.retry ? config.retry + 1 : 1;

    // Exponential backoff
    const delay = Math.pow(2, config.retry) * 100;

    console.log(`Retrying request to ${config.url} (attempt ${config.retry})`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return API(config);
  }
);

// Add response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect for non-checkout routes
      const isCheckoutRoute = error.config.url.includes('/orders') && error.config.method === 'post';
      
      if (!isCheckoutRoute) {
        console.error("401 Unauthorized - clearing token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Don't automatically redirect for checkout
        if (!window.location.pathname.includes('/checkout')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const AuthService = {
  register: async (userData) => {
    const response = await API.post("/auth/register", userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await API.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  },

  isLoggedIn: () => {
    return localStorage.getItem("token") !== null;
  },

  isAdmin: () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return false;
      const user = JSON.parse(userStr);
      return user && user.role === "admin";
    } catch (err) {
      console.error("Error checking admin status:", err);
      return false;
    }
  },

  // Google OAuth methods
  initiateGoogleAuth: () => {
    const apiUrl = process.env.REACT_APP_API_URL || "/api";
    window.location.href = `${apiUrl}/auth/google`;
  },

  handleGoogleCallback: (searchParams) => {
    // This is handled by the AuthSuccess component
  },

  // Add new user profile methods
  getUserProfile: async () => {
    try {
      const response = await API.get("/users/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  updateUserProfile: async (profileData) => {
    try {
      const response = await API.put("/users/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await API.put("/users/change-password", passwordData);
      return response.data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  // Address management
  getAddresses: async () => {
    try {
      const response = await API.get("/users/addresses");
      return response.data;
    } catch (error) {
      console.error("Error fetching addresses:", error);
      throw error;
    }
  },

  addAddress: async (addressData) => {
    try {
      const response = await API.post("/users/addresses", addressData);
      return response.data;
    } catch (error) {
      console.error("Error adding address:", error);
      throw error;
    }
  },

  updateAddress: async (id, addressData) => {
    try {
      const response = await API.put(`/users/addresses/${id}`, addressData);
      return response.data;
    } catch (error) {
      console.error("Error updating address:", error);
      throw error;
    }
  },

  deleteAddress: async (id) => {
    try {
      const response = await API.delete(`/users/addresses/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting address:", error);
      throw error;
    }
  }
};

// Product API calls
export const ProductService = {
  getAllProducts: async (params = {}) => {
    try {
      console.log("Fetching all products with params:", params);
      const response = await API.get("/products", { params });
      console.log("API response status:", response.status);
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      console.log("Fetching product by ID:", id, typeof id);
      const response = await API.get(`/products/${id}`);
      console.log("Product by ID response status:", response.status);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ID ${id}:`, error);
      throw error;
    }
  },

  getProductsByCategory: async (category, params = {}) => {
    try {
      console.log("Fetching products by category:", category);
      const response = await API.get(`/products/category/${category}`, {
        params,
      });
      console.log("Products by category response status:", response.status);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw error;
    }
  },
  getBrands: async () => {
    const response = await API.get("/products/brands");
    return response.data;
  },

  getNewProducts: async () => {
    const response = await API.get("/products/new");
    return response.data;
  },

  getBestSellerProducts: async () => {
    const response = await API.get("/products/bestseller");
    return response.data;
  },

  createProduct: async (productData) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    console.log("Creating product with data:", Object.fromEntries(productData));
    console.log("Auth token:", localStorage.getItem("token") ? "Present" : "Missing");
    
    // Make sure we're calling the correct endpoint
    const response = await API.post("/products", productData, config);
    return response.data;
  },


  updateProduct: async (id, productData) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    console.log("Updating product with data:", Object.fromEntries(productData));
    const response = await API.put(`/products/${id}`, productData, config);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  },

  getAdminProducts: async () => {
    const response = await API.get("/products");
    return response.data;
  },
};

// Cart Service
export const CartService = {
  getCart: async () => {
    const response = await API.get("/cart", {
      withCredentials: true, // Important for cookies
    });
    return response.data;
  },

  addItem: async (item) => {
    const response = await API.post("/cart/items", item, {
      withCredentials: true,
    });
    return response.data;
  },

  updateItemQuantity: async (itemId, quantity) => {
    const response = await API.put(
      `/cart/items/${itemId}`,
      { quantity },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  removeItem: async (itemId) => {
    const response = await API.delete(`/cart/items/${itemId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  clearCart: async () => {
    const response = await API.delete("/cart/clear", {
      withCredentials: true,
    });
    return response.data;
  },

  associateCart: async () => {
    const response = await API.post(
      "/cart/associate",
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  },
};



// Review Service
export const ReviewService = {
  getReviewsByProduct: async (productId, params = {}) => {
    const response = await API.get(`/reviews/${productId}`, { params });
    return response.data;
  },

  createReview: async (reviewData) => {
    try {
      console.log("Review data being sent:", reviewData);
      console.log("Auth token present:", !!localStorage.getItem("token"));
      const response = await API.post("/reviews/", reviewData);
      return response.data;
    } catch (error) {
      console.error("Review submission error details:", {
        message: error.message,
        response: error.response
          ? {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            }
          : "No response",
        request: error.request
          ? "Request sent but no response received"
          : "Request setup failed",
      });
      throw error;
    }
  },

  deleteReview: async (id) => {
    const response = await API.delete(`/reviews/${id}`);
    return response.data;
  },
};

// Order Service
export const OrderService = {
  createOrder: async (orderData) => {
    try {
      const response = await API.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  getUserOrders: async (params = {}) => {
    try {
      console.log('Fetching user orders with params:', params);
      const response = await API.get('/orders', { params });
      console.log('User orders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },
  
  getOrderDetails: async (orderId) => {
    try {
      const response = await API.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order details (ID: ${orderId}):`, error);
      throw error;
    }
  },
  
  getOrderStatusHistory: async (orderId) => {
    try {
      const response = await API.get(`/orders/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order status history (ID: ${orderId}):`, error);
      throw error;
    }
  },
  
  trackGuestOrder: async (trackingData) => {
    try {
      const response = await API.post('/orders/guest', trackingData);
      return response.data;
    } catch (error) {
      console.error('Error tracking guest order:', error);
      throw error;
    }
  }
};

//Admin Func
export const AdminService = {
  // Order management
  getAllOrders: async (params = {}) => {
    try {
      const response = await API.get('/admin/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },
  
  getOrderDetails: async (orderId) => {
    const response = await API.get(`/admin/orders/${orderId}`);
    return response.data;
  },
  
  updateOrderStatus: async (orderId, statusData) => {
    const response = await API.put(`/admin/orders/${orderId}/status`, statusData);
    return response.data;
  },

  getOrderStatusHistory: async (orderId) => {
    const response = await API.get(`/admin/orders/${orderId}/status`);
    return response.data;
  },
  
  getOrderStats: async (params = {}) => {
    const response = await API.get("/admin/stats", { params });
    return response.data;
  },
  
  // User management - FIXED: Using admin-specific routes
  getAllUsers: async () => {
    const response = await API.get("/users/admin/all");
    return response.data;
  },
  
  updateUser: async (id, userData) => {
    const response = await API.put(`/users/admin/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id) => {
    const response = await API.delete(`/users/admin/${id}`);
    return response.data;
  },
  
  // Dashboard stats
  getDashboardStats: async () => {
    const response = await API.get("/admin/dashboard/stats");
    return response.data;
  }
};

export default API;
