import axios from 'axios';

const API_URL ='http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {};
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Only clear token and redirect if not already on auth pages
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        // Use setTimeout to avoid blocking the error handler
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    // Return structured error
    return Promise.reject({
      status: errorData.status || 'error',
      message: errorData.message || error.message || 'An error occurred',
      error: errorData.error,
      ...errorData
    });
  }
);

export default api;