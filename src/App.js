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
import { AlertProvider } from './context/AlertContext';
import { TripStateProvider } from './context/TripStateContext';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from './theme';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Hide native splash immediately to show our custom splash
const hideNativeSplash = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (error) {
    Logger.warn('App', 'Error hiding native splash', error);
  }
};
hideNativeSplash();

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
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
      Logger.debug('App', 'Sentry Event Captured', {
        eventId: event.event_id,
        message: event.exception?.values?.[0]?.value
      });
    }
    return event;
  },
});

// Shown when the 8 s safety-valve fires before all data loaded.
function ConnectionErrorScreen({ onRetry }) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.icon}>⚠️</Text>
      <Text style={errorStyles.title}>Sem ligação</Text>
      <Text style={errorStyles.message}>
        Não foi possível ligar ao servidor.{'\n'}
        Verifique a sua ligação à internet e tente novamente.
      </Text>
      <TouchableOpacity style={errorStyles.button} onPress={onRetry} activeOpacity={0.8} accessibilityLabel="Tentar novamente" accessibilityRole="button">
        <Text style={errorStyles.buttonText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl * 2,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

// Inner App Component that shows splash, error, or main app
function AppContent() {
  const { appReady, loadingTimedOut, retryLoading } = useAppLoading();

  useEffect(() => {
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

  if (!appReady) {
    return <SplashScreenComponent />;
  }

  // Timeout fired before data loaded — show a recoverable error screen
  if (loadingTimedOut) {
    return <ConnectionErrorScreen onRetry={retryLoading} />;
  }

  return (
    <ErrorBoundary>
      <AlertProvider>
        <LocationPermissionsService />
        <TripStateProvider>
          <UserLocationStateContextProvider>
            <AppNav />
          </UserLocationStateContextProvider>
        </TripStateProvider>
      </AlertProvider>
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
