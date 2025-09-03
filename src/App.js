import * as Sentry from '@sentry/react-native';
import { UserContextProvider } from "./context/UserContext";
import { UserLocationStateContextProvider } from "./context/UserLocationStateContext";
import { AuthProvider } from "./context/AuthContext";
import { UserDataProvider } from "./context/UserDataContext";
import { SocketProvider } from "./context/SocketContext";
import AppNav from "./navigation/AppNav";
import ErrorBoundary from './components/common/ErrorBoundary';
import Logger from './utils/Logger';
import React, { useEffect } from 'react';

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "https://your-dsn-here@sentry.io/your-project-id",
  environment: __DEV__ ? "development" : "production",
  sendDefaultPii: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  profilesSampleRate: __DEV__ ? 1.0 : 0.2,
  debug: __DEV__,
  enableUserInteractionTracing: false, // Disable to prevent native frames error
  enableNative: false, // Disable native integration to prevent errors
  beforeSend(event) {
    // Filter out certain errors in development
    if (__DEV__ && event.exception) {
      console.debug('Sentry Event Captured', { 
        eventId: event.event_id, 
        message: event.exception?.values?.[0]?.value 
      });
    }
    return event;
  },
});

function App() {
  useEffect(() => {
    // Set initial Sentry context
    try {
      Sentry.setTag('app_component', 'App');
      Sentry.setContext('app', {
        environment: __DEV__ ? 'development' : 'production',
        sessionId: Logger.getSessionId(),
        startTime: new Date().toISOString(),
      });
      
      Sentry.addBreadcrumb({
        category: 'app',
        message: 'Application started',
        level: 'info',
      });
    } catch (error) {
      console.warn('Failed to set initial Sentry context:', error);
    }
    
    Logger.info('App', 'Application started', {
      environment: __DEV__ ? 'development' : 'production',
      timestamp: new Date().toISOString(),
      sessionId: Logger.getSessionId()
    });
    
    // Log app lifecycle events
    const handleAppStateChange = (nextAppState) => {
      Logger.info('App', `App state changed to: ${nextAppState}`);
      
      // Add Sentry breadcrumb for app state changes
      try {
        Sentry.addBreadcrumb({
          category: 'app',
          message: `App state changed to: ${nextAppState}`,
          level: 'info',
        });
      } catch (error) {
        console.warn('Failed to add Sentry breadcrumb for app state change:', error);
      }
    };
    
    return () => {
      Logger.info('App', 'Application cleanup initiated');
      
      try {
        Sentry.addBreadcrumb({
          category: 'app',
          message: 'Application cleanup initiated',
          level: 'info',
        });
      } catch (error) {
        console.warn('Failed to add Sentry breadcrumb for app cleanup:', error);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserDataProvider>
          <SocketProvider>
            <UserContextProvider>
              <UserLocationStateContextProvider>
                <AppNav />
              </UserLocationStateContextProvider>
            </UserContextProvider>
          </SocketProvider>
        </UserDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
