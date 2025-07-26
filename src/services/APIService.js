import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorService from './ErrorService';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_UREBOQUE_API,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
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
  (response) => response,
  (error) => {
    ErrorService.handleAPIError(error);
    return Promise.reject(error);
  }
);

export default api;