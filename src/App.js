import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { UserContextProvider } from "./context/UserContext";
import { UserLocationStateContextProvider } from "./context/UserLocationStateContext";
import { AuthProvider } from "./context/AuthContext";
import { UserDataProvider } from "./context/UserDataContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AppLoadingProvider, useAppLoading } from "./context/AppLoadingContext";
import AppNav from "./navigation/AppNav";
import ErrorBoundary from './components/common/ErrorBoundary';
import SplashScreenComponent from './components/common/SplashScreen';
import Logger from './utils/Logger';
import { LocationPermissionsService } from './services/LocationPermissionsService';
import React, { useEffect, useState } from 'react';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Hide native splash immediately to show our custom splash
const hideNativeSplash = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (error) {
    console.warn('Error hiding native splash:', error);
  }
};
hideNativeSplash();

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

// Inner App Component that shows splash or main app
function AppContent() {
  const { appReady } = useAppLoading();

  useEffect(() => {
    // Initialize Sentry
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

    Logger.info('App', 'Application started', {
      environment: __DEV__ ? 'development' : 'production',
      timestamp: new Date().toISOString(),
      sessionId: Logger.getSessionId()
    });
  }, []);

  // Show splash screen while app is loading
  if (!appReady) {
    return <SplashScreenComponent />;
  }

  // Show main app when everything is ready
  return (
    <ErrorBoundary>
      <LocationPermissionsService />
      <UserLocationStateContextProvider>
        <AppNav />
      </UserLocationStateContextProvider>
    </ErrorBoundary>
  );
}

// Main App Component with all context providers
function AppWithContexts() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserDataProvider>
          <SocketProvider>
            <NotificationProvider>
              <UserContextProvider>
                <AppLoadingProvider>
                  <AppContent />
                </AppLoadingProvider>
              </UserContextProvider>
            </NotificationProvider>
          </SocketProvider>
        </UserDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function App() {
  return <AppWithContexts />;
}

export default App;
