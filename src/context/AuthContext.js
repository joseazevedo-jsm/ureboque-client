import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogger } from '../hooks/useLogger';
import sentryService from '../services/SentryService';
 
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
    
    // Add Sentry breadcrumb for login attempt
    sentryService.addUserAction('login_attempt', { userId });
    
    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'login_started');
      
      setUserToken(token);
      setIsAuthenticated(true);
      logger.logStateChange('isAuthenticated', false, true, 'login_success');
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', userId);
      
      // Set Sentry user context on successful login
      sentryService.setUser({
        id: userId,
        authenticated: true
      });
      
      sentryService.addUserAction('login_success', { 
        userId, 
        duration: timer.end() 
      });
      
      logger.info('Login completed successfully', { userId, duration: timer.end() });
      return { success: true };
    } catch (error) {
      // Capture login error in Sentry
      sentryService.captureError(error, {
        auth: {
          operation: 'login',
          userId,
          step: 'authentication'
        }
      }, { auth_operation: 'login' });
      
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
    
    // Add Sentry breadcrumb for logout attempt
    sentryService.addUserAction('logout_attempt');
    
    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'logout_started');
      
      setUserToken(null);
      setIsAuthenticated(false);
      logger.logStateChange('isAuthenticated', true, false, 'logout_success');
      
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      
      // Clear Sentry user context on logout
      sentryService.setUser(null);
      
      sentryService.addUserAction('logout_success', { 
        duration: timer.end() 
      });
      
      logger.info('Logout completed successfully', { duration: timer.end() });
    } catch (error) {
      // Capture logout error in Sentry
      sentryService.captureError(error, {
        auth: {
          operation: 'logout',
          step: 'cleanup'
        }
      }, { auth_operation: 'logout' });
      
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
      const userId = await AsyncStorage.getItem('userId');

      if (token && userId) {
        setUserToken(token);
        setIsAuthenticated(true);

        // Restore Sentry user context from storage
        sentryService.setUser({
          id: userId,
          authenticated: true,
          restored: true
        });

        sentryService.addUserAction('auth_state_restored', {
          userId,
          fromStorage: true
        });

        logger.info('Authentication state restored from storage', { hasToken: !!token });
        logger.logStateChange('isAuthenticated', false, true, 'restored_from_storage');
      } else {
        logger.debug('No authentication token found in storage');

        sentryService.addUserAction('auth_check_no_token');
      }
    } catch (error) {
      // Capture auth state check error in Sentry
      sentryService.captureError(error, {
        auth: {
          operation: 'auth_state_check',
          step: 'token_retrieval'
        }
      }, { auth_operation: 'auth_check' });

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