import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const INITIAL_PHASES = { auth: false, userData: false, navigation: false };

export const AppLoadingProvider = ({ children }) => {
  const logger = useLogger('AppLoadingContext');
  const { isLoading: authLoading, isAuthenticated, userToken } = useAuth();
  const { isLoading: userDataLoading, user, fetchUserById } = useUserData();

  const [retryKey, setRetryKey] = useState(0);
  const [appReady, setAppReady] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(INITIAL_PHASES);

  // Ref so the timeout callback can read the current appReady without a stale closure
  const appReadyRef = useRef(false);

  // Track auth completion.
  // retryKey in deps ensures this re-runs after a user-triggered retry,
  // even when authLoading is already false (auth was never the problem).
  useEffect(() => {
    if (!authLoading) {
      logger.info('Auth phase completed', { isAuthenticated, hasToken: !!userToken });
      setLoadingPhases(prev => ({ ...prev, auth: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, userToken, retryKey]);

  // Track user data completion
  useEffect(() => {
    if (loadingPhases.auth) {
      if (isAuthenticated && userToken) {
        if (!userDataLoading && user) {
          logger.info('User data phase completed', { userId: user?.id });
          setLoadingPhases(prev => ({ ...prev, userData: true }));
        }
      } else {
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
      // All prerequisites are already complete. Deferring this state change
      // behind a timer leaves the splash permanently mounted if the provider
      // is refreshed/remounted before the callback runs.
      appReadyRef.current = true;
      setAppReady(true);
    }
  }, [loadingPhases.auth, loadingPhases.userData, logger]);

  // Safety valve — if loading phases never complete (network hang, API error),
  // surface a timeout so the caller can show a proper "failed to connect" screen.
  // Restarts whenever the user triggers a retry.
  // Uses appReadyRef to avoid reading stale closure state after 8 s.
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      if (!appReadyRef.current) {
        logger.warn('Max loading timeout reached — surfacing error to user');
        setLoadingTimedOut(true);
        appReadyRef.current = true;
        setAppReady(true);
      }
    }, 8000);
    return () => clearTimeout(maxTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // Let the user retry after a timeout failure.
  const retryLoading = useCallback(() => {
    logger.info('User initiated retry after load timeout');
    appReadyRef.current = false;
    setLoadingTimedOut(false);
    setAppReady(false);
    setLoadingPhases(INITIAL_PHASES);
    // Re-fetch user data if the user was authenticated when things failed
    if (isAuthenticated && userToken && fetchUserById) {
      AsyncStorage.getItem('userId').then(userId => {
        if (userId) fetchUserById(userId);
      }).catch(() => {});
    }
    // Incrementing retryKey forces the auth + timeout effects to re-run
    setRetryKey(k => k + 1);
  }, [isAuthenticated, userToken, fetchUserById, logger]);

  const value = useMemo(() => ({
    appReady,
    loadingTimedOut,
    loadingPhases,
    isLoading: !appReady,
    retryLoading,
  }), [appReady, loadingTimedOut, loadingPhases, retryLoading]);

  return (
    <AppLoadingContext.Provider value={value}>
      {children}
    </AppLoadingContext.Provider>
  );
};
