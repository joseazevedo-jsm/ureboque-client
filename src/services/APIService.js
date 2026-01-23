import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorService from './ErrorService';
import Logger from '../utils/Logger';
import sentryService from './SentryService';
import AuthEventService from './AuthEventService';

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
      
      // Add Sentry breadcrumb for unauthenticated requests
      sentryService.addApiCall(
        config.method?.toUpperCase() || 'UNKNOWN',
        config.url,
        0, // No status yet
        {
          hasToken: false,
          unauthenticated: true
        }
      );
    }
    
    // Set API context in Sentry for this request
    sentryService.setContext('api_request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token,
      hasData: !!config.data,
      timeout: config.timeout,
      timestamp: new Date().toISOString()
    });
    
    return config;
  },
  (error) => {
    Logger.error('APIService', 'Request interceptor error', {
      error: error.message,
      config: error.config?.url
    });
    
    // Capture request setup errors in Sentry
    sentryService.captureError(error, {
      api: {
        phase: 'request_setup',
        url: error.config?.url,
        operation: 'interceptor_error'
      }
    }, { api_interceptor: 'request' });
    
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

    // Update Sentry context with successful response
    sentryService.setContext('api_response', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      duration,
      success: true,
      timestamp: new Date().toISOString()
    });

    // Add performance breadcrumb for slow requests
    if (duration > 2000) {
      sentryService.addUserAction('slow_api_request', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        duration,
        status: response.status
      });
    }

    return response;
  },
  async (error) => {
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


    // Update Sentry context with error response
    sentryService.setContext('api_response', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status || 0,
      duration,
      success: false,
      errorType: error.response ? 'server_error' : error.request ? 'network_error' : 'client_error',
      timestamp: new Date().toISOString()
    });

    const status = error.response?.status;
    const errorMessage = error.response?.data?.error;
    const isInvalidToken = status === 401 || (status === 403 && errorMessage === 'Invalid token');

    if (isInvalidToken) {
      Logger.info('APIService', 'Invalid token detected, triggering logout', { status, errorMessage });
      AuthEventService.emitInvalidToken();
    } else {
      ErrorService.handleAPIError(error, false, 'APIService');
    }

    return Promise.reject(error);
  }
);

export default api;