import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Interceptor - Token:', token ? 'exists' : 'missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Interceptor - Headers set:', config.headers);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      console.error('401 Unauthorized - clearing token');
      // Clear token if it's invalid
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
}
};

// Product API calls
export const ProductService = {
  getAllProducts: async () => {
    const response = await API.get('/products');
    return response.data;
  },
  
  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },
  
  getProductsByCategory: async (category) => {
    const response = await API.get(`/products/category/${category}`);
    return response.data;
  },
  
  createProduct: async (productData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    
    try {
      console.log("Sending request to:", API.defaults.baseURL + '/products');
      console.log("With headers:", config.headers);
      console.log("Form data keys:", [...productData.keys()]);
      
      const response = await API.post('/products', productData, config);
      return response.data;
    } catch (error) {
      console.error("Full error details:", error);
      throw error;
    }
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

export default API;