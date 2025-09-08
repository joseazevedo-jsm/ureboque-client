import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useUserData } from './UserDataContext';
import { useLogger } from '../hooks/useLogger';

const AppLoadingContext = createContext();

export const useAppLoading = () => {
  const context = useContext(AppLoadingContext);
  if (!context) {
    throw new Error('useAppLoading must be used within an AppLoadingProvider');
  }
  return context;
};

export const AppLoadingProvider = ({ children }) => {
  const logger = useLogger('AppLoadingContext');
  const { isLoading: authLoading, isAuthenticated, userToken } = useAuth();
  const { isLoading: userDataLoading, user } = useUserData();
  
  const [appReady, setAppReady] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState({
    auth: false,      // Auth token check complete
    userData: false,  // User data loaded (if needed)
    navigation: false // Ready to show final screen
  });

  // Track auth completion
  useEffect(() => {
    if (!authLoading) {
      logger.info('Auth phase completed', { isAuthenticated, hasToken: !!userToken });
      setLoadingPhases(prev => ({ ...prev, auth: true }));
    }
  }, [authLoading, isAuthenticated, userToken, logger]);

  // Track user data completion
  useEffect(() => {
    if (loadingPhases.auth) {
      if (isAuthenticated && userToken) {
        // If authenticated, wait for user data to load
        if (!userDataLoading && user) {
          logger.info('User data phase completed', { userId: user?.id });
          setLoadingPhases(prev => ({ ...prev, userData: true }));
        }
      } else {
        // If not authenticated, no need to wait for user data
        logger.info('User data phase skipped - not authenticated');
        setLoadingPhases(prev => ({ ...prev, userData: true }));
      }
    }
  }, [loadingPhases.auth, isAuthenticated, userToken, userDataLoading, user, logger]);

  // Track navigation readiness
  useEffect(() => {
    if (loadingPhases.auth && loadingPhases.userData) {
      logger.info('Navigation phase completed - app ready');
      setLoadingPhases(prev => ({ ...prev, navigation: true }));
      
      // Add minimum splash display time (2 seconds)
      const timer = setTimeout(() => {
        logger.info('App is ready to show');
        setAppReady(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loadingPhases.auth, loadingPhases.userData, logger]);

  // Debug logging
  useEffect(() => {
    logger.info('Loading phases updated', {
      phases: loadingPhases,
      appReady,
      authState: { isAuthenticated, hasToken: !!userToken, authLoading },
      userDataState: { hasUser: !!user, userDataLoading }
    });
  }, [loadingPhases, appReady, isAuthenticated, userToken, authLoading, user, userDataLoading, logger]);

  const value = {
    appReady,
    loadingPhases,
    isLoading: !appReady
  };

  return (
    <AppLoadingContext.Provider value={value}>
      {children}
    </AppLoadingContext.Provider>
  );
};