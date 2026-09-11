import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogger } from '../hooks/useLogger';
import sentryService from '../services/SentryService';
import AuthEventService from '../services/AuthEventService';
 
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
  const rejectedBearerRef = useRef(null);
  const mountedRef = useRef(true);
  const authOperationRef = useRef(0);

  const login = useCallback(async (token, userId) => {
    const operationId = ++authOperationRef.current;
    const timer = logger.startTimer('login_operation');
    logger.info('Login attempt started', { userId });
    
    // Add Sentry breadcrumb for login attempt
    sentryService.addUserAction('login_attempt', { userId });
    
    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'login_started');
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', userId);

      if (!mountedRef.current || operationId !== authOperationRef.current) return { success: false };
      setUserToken(token);
      setIsAuthenticated(true);
      logger.logStateChange('isAuthenticated', false, true, 'login_success');
      // A fresh session must be able to react to its own future invalid-token
      // event even if a previous session's rejection happened to carry the
      // same bearer value (extremely unlikely, but free to guard against).
      rejectedBearerRef.current = null;
      
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
      if (mountedRef.current && operationId === authOperationRef.current) setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'login_finished');
    }
  }, [logger]);

  const logout = useCallback(async () => {
    const operationId = ++authOperationRef.current;
    const timer = logger.startTimer('logout_operation');
    logger.info('Logout started');
    
    // Add Sentry breadcrumb for logout attempt
    sentryService.addUserAction('logout_attempt');
    
    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'logout_started');
      
      if (!mountedRef.current || operationId !== authOperationRef.current) return;
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
      if (mountedRef.current && operationId === authOperationRef.current) setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'logout_finished');
    }
  }, [logger]);

  const checkAuthState = async () => {
    const operationId = authOperationRef.current;
    const timer = logger.startTimer('auth_state_check');
    logger.debug('Checking authentication state');

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      if (token && userId) {
        if (!mountedRef.current || operationId !== authOperationRef.current) return;
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
      if (mountedRef.current && operationId === authOperationRef.current) setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'auth_check_finished');
      timer.end({ authenticated: isAuthenticated });
    }
  };


  useEffect(() => {
    mountedRef.current = true;
    checkAuthState();
    return () => { mountedRef.current = false; };
  }, []);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // The active session's bearer, and the last rejection we already acted on —
  // together these make invalid-token handling session-aware and single-flight:
  // a delayed 401 from a token that isn't the current session's is ignored
  // (it can't mean anything about the session that's active now), and several
  // concurrent 401s for the same session's token trigger logout() only once.
  const currentBearerRef = useRef(null);
  useEffect(() => {
    currentBearerRef.current = userToken ? `Bearer ${userToken}` : null;
  }, [userToken]);

  useEffect(() => {
    const unsubscribe = AuthEventService.subscribe((rejectedBearer) => {
      if (rejectedBearer && rejectedBearer !== currentBearerRef.current) {
        logger.info('Ignoring invalid-token event for a non-current session');
        return;
      }
      if (rejectedBearerRef.current === rejectedBearer) {
        logger.debug('Invalid-token event already processed for this session, skipping');
        return;
      }
      rejectedBearerRef.current = rejectedBearer;

      logger.info('Invalid token event received, logging out');
      logoutRef.current();
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    userToken,
    isLoading,
    login,
    logout,
  }), [isAuthenticated, userToken, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
