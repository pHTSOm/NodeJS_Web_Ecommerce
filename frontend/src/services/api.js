import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Add auth token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;    
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add retry mechanism for network errors
API.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    // Only retry on network errors or 5xx responses
    if (!config || !config.retry || config.retry >= 3 ||
        (error.response && error.response.status < 500)) {
      return Promise.reject(error);
    }
    
    // Set retry count
    config.retry = config.retry ? config.retry + 1 : 1;
    
    // Exponential backoff
    const delay = Math.pow(2, config.retry) * 100;
    
    console.log(`Retrying request to ${config.url} (attempt ${config.retry})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return API(config);
  }
);


// Add response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized - clearing token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const AuthService = {
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  isLoggedIn: () => {
    return localStorage.getItem('token') !== null;
  },
  
  isAdmin: () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user && user.role === 'admin';
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
},
  // Add new user profile methods
  getUserProfile: async () => {
    const response = await API.get('/users/me');
    return response.data;
  },
  
  updateUserProfile: async (profileData) => {
    const response = await API.put('/users/me', profileData);
    return response.data;
  },
  
  // Address management
  getAddresses: async () => {
    const response = await API.get('/users/addresses');
    return response.data;
  },
  
  addAddress: async (addressData) => {
    const response = await API.post('/users/addresses', addressData);
    return response.data;
  },
  
  updateAddress: async (id, addressData) => {
    const response = await API.put(`/users/addresses/${id}`, addressData);
    return response.data;
  },
  
  deleteAddress: async (id) => {
    const response = await API.delete(`/users/addresses/${id}`);
    return response.data;
  }
};

// Product API calls
export const ProductService = {
  getAllProducts: async (params = {}) => {
    console.log('API call parameters:', params);
    const response = await API.get('/products', { params });
    console.log('API response:', response);
    return response.data;
  },
  
  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },
  
  getProductsByCategory: async (category, params = {}) => {
    const response = await API.get(`/products/category/${category}`, { params });
    return response.data;
  },
  
  getBrands: async () => {
    const response = await API.get('/products/brands');
    return response.data;
  },
  
  getNewProducts: async () => {
    const response = await API.get('/products/new');
    return response.data;
  },
  
  getBestSellerProducts: async () => {
    const response = await API.get('/products/bestseller');
    return response.data;
  },

  createProduct: async (productData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    const response = await API.post('/products', productData, config);
    return response.data;
  },
  
  updateProduct: async (id, productData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    
    const response = await API.put(`/products/${id}`, productData, config);
    return response.data;
  },
  
  deleteProduct: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  },

  getAdminProducts: async () => {
    
    const response = await API.get('/products');
    return response.data;
  },
};


// Cart Service
export const CartService = {
  getCart: async () => {
    const response = await API.get('/cart', { 
      withCredentials: true // Important for cookies
    });
    return response.data;
  },
  
  addItem: async (item) => {
    const response = await API.post('/cart/items', item, { 
      withCredentials: true 
    });
    return response.data;
  },
  
  updateItemQuantity: async (itemId, quantity) => {
    const response = await API.put(`/cart/items/${itemId}`, { quantity }, { 
      withCredentials: true 
    });
    return response.data;
  },
  
  removeItem: async (itemId) => {
    const response = await API.delete(`/cart/items/${itemId}`, { 
      withCredentials: true 
    });
    return response.data;
  },
  
  clearCart: async () => {
    const response = await API.delete('/cart/clear', { 
      withCredentials: true 
    });
    return response.data;
  },
  
  associateCart: async () => {
    const response = await API.post('/cart/associate', {}, { 
      withCredentials: true 
    });
    return response.data;
  }
};

// Review Service
export const ReviewService = {
  getReviewsByProduct: async (productId, params = {}) => {
    const response = await API.get(`/reviews/${productId}`, { params });
    return response.data;
  },
  
  createReview: async (reviewData) => {
    try {
      console.log('Review data being sent:', reviewData);
      console.log('Auth token present:', !!localStorage.getItem('token'));
      const response = await API.post('/reviews/', reviewData);
      return response.data;
    } catch (error) {
      console.error('Review submission error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response',
        request: error.request ? 'Request sent but no response received' : 'Request setup failed'
      });
      throw error;
    }
  },
  
  deleteReview: async (id) => {
    const response = await API.delete(`/reviews/${id}`);
    return response.data;
  }
};

// Order Service
export const OrderService = {
  createOrder: async (orderData) => {
    const response = await API.post('/orders', orderData);
    return response.data;
  },
  
  getOrders: async () => {
    const response = await API.get('/orders');
    return response.data;
  },
  
  getOrderDetails: async (id) => {
    const response = await API.get(`/orders/${id}`);
    return response.data;
  },
  
  getGuestOrders: async (guestData) => {
    const response = await API.post('/orders/guest', guestData);
    return response.data;
  },
  
  // Admin endpoints
  getAllOrders: async (params = {}) => {
    const response = await API.get('/admin/orders', { params });
    return response.data;
  },
  
  updateOrderStatus: async (id, statusData) => {
    const response = await API.put(`/admin/orders/${id}/status`, statusData);
    return response.data;
  }
};

// Admin Service for additional admin functionality
export const AdminService = {
  getAllUsers: async () => {
    const response = await API.get('/admin/users');
    return response.data;
  },
  
  updateUser: async (id, userData) => {
    const response = await API.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id) => {
    const response = await API.delete(`/admin/users/${id}`);
    return response.data;
  }
};


export default API;