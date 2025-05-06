// product-service/utils/serviceClient.js
const axios = require('axios');

// Create a client with retry logic for resilience
const createServiceClient = (baseURL, maxRetries = 3, timeout = 5000) => {
  const client = axios.create({
    baseURL,
    timeout
  });
  
  // Add response interceptor for retries
  client.interceptors.response.use(null, async (error) => {
    const { config } = error;
    
    // Only retry on network errors or 5xx responses
    if (!config || !config.retry || config.retry >= maxRetries ||
        (error.response && error.response.status < 500)) {
      return Promise.reject(error);
    }
    
    // Set retry count
    config.retry = config.retry ? config.retry + 1 : 1;
    
    // Exponential backoff
    const delay = Math.pow(2, config.retry) * 100;
    
    console.log(`Retrying request to ${config.url} (attempt ${config.retry})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return client(config);
  });
  
  return client;
};

// Usage in admin middleware
const userServiceClient = createServiceClient(process.env.USER_SERVICE_URL);

exports.adminOnly = async (req, res, next) => {
  try {
    // ...
    const response = await userServiceClient.get('/api/users/check-role', {
      headers: { Authorization: req.headers.authorization }
    });
    // ...
  } catch (error) {
    // Handle errors
  }
};

module.exports = { createServiceClient };