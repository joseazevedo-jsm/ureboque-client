import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogger } from '../hooks/useLogger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const logger = useLogger('AuthContext', { enableLifecycleLogging: true });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (token, userId) => {
    const timer = logger.startTimer('login_operation');
    logger.info('Login attempt started', { userId });
    
    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'login_started');
      
      setUserToken(token);
      setIsAuthenticated(true);
      logger.logStateChange('isAuthenticated', false, true, 'login_success');
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', userId);
      
      logger.info('Login completed successfully', { userId, duration: timer.end() });
      return { success: true };
    } catch (error) {
      logger.logError(error, { userId, operation: 'login' });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'login_finished');
    }
  };

  const logout = async () => {
    const timer = logger.startTimer('logout_operation');
    logger.info('Logout started');
    
    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'logout_started');
      
      setUserToken(null);
      setIsAuthenticated(false);
      logger.logStateChange('isAuthenticated', true, false, 'logout_success');
      
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      
      logger.info('Logout completed successfully', { duration: timer.end() });
    } catch (error) {
      logger.logError(error, { operation: 'logout' });
    } finally {
      setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'logout_finished');
    }
  };

  const checkAuthState = async () => {
    const timer = logger.startTimer('auth_state_check');
    logger.debug('Checking authentication state');
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        setIsAuthenticated(true);
        logger.info('Authentication state restored from storage', { hasToken: !!token });
        logger.logStateChange('isAuthenticated', false, true, 'restored_from_storage');
      } else {
        logger.debug('No authentication token found in storage');
      }
    } catch (error) {
      logger.logError(error, { operation: 'auth_state_check' });
    } finally {
      setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'auth_check_finished');
      timer.end({ authenticated: isAuthenticated });
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const value = {
    isAuthenticated,
    userToken,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};