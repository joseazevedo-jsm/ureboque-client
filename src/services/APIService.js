import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorService from './ErrorService';
import Logger from '../utils/Logger';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_UREBOQUE_API,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    
    Logger.logApiRequest(
      'APIService',
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url,
      config.data
    );
    
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      Logger.debug('APIService', 'Authorization token added to request', { 
        url: config.url, 
        hasToken: true 
      });
    } else {
      Logger.debug('APIService', 'No authorization token found', { url: config.url });
    }
    
    return config;
  },
  (error) => {
    Logger.error('APIService', 'Request interceptor error', {
      error: error.message,
      config: error.config?.url
    });
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const endTime = Date.now();
    const startTime = response.config.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    Logger.logApiResponse(
      'APIService',
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url,
      response.status,
      response.data,
      duration
    );
    
    return response;
  },
  (error) => {
    const endTime = Date.now();
    const startTime = error.config?.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    Logger.logApiResponse(
      'APIService',
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'unknown-url',
      error.response?.status || 0,
      error.response?.data,
      duration
    );
    
    ErrorService.handleAPIError(error, true, 'APIService');
    return Promise.reject(error);
  }
);

export default api;