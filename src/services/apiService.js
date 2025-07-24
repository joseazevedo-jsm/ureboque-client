import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_UREBOQUE_API;

// Main API instance for the application
export const api = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// OTP API instance for external service
export const otpApi = axios.create({
  baseURL: "https://api.releans.com/v2/message",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_OTP_API_TOKEN}`,
  },
  maxRedirects: 20,
});

// Chat API instance
export const chatApi = axios.create({
  baseURL: `${API_BASE_URL}/messages`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = global.userToken; // You can get this from AsyncStorage or Redux
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
const createResponseInterceptor = (apiInstance) => {
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // Handle unauthorized access
            console.warn('Unauthorized access - redirecting to login');
            break;
          case 403:
            console.warn('Forbidden access');
            break;
          case 404:
            console.warn('Resource not found');
            break;
          case 500:
            console.error('Server error');
            break;
          default:
            console.error(`API Error ${status}:`, data?.message || error.message);
        }
        
        return Promise.reject({
          status,
          message: data?.message || error.message,
          data: data
        });
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.message);
        return Promise.reject({
          status: 0,
          message: 'Network error - please check your connection',
          data: null
        });
      } else {
        // Other error
        console.error('Request error:', error.message);
        return Promise.reject({
          status: -1,
          message: error.message,
          data: null
        });
      }
    }
  );
};

// Apply response interceptors to all API instances
createResponseInterceptor(api);
createResponseInterceptor(otpApi);
createResponseInterceptor(chatApi);

export default api;