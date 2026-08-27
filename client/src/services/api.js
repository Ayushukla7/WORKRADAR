import axios from 'axios';

/**
 * Centralized Axios instance for WorkRadar REST API.
 * Automatically attaches Authorization header if JWT token is stored in localStorage.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workradar_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized — clear invalid token
      localStorage.removeItem('workradar_token');
      localStorage.removeItem('workradar_user');
    }
    return Promise.reject(error);
  }
);

export default api;
