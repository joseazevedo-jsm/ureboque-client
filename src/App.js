import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppButton } from './components/common/AppButton';
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
import Logger, { sanitizeForRemote } from './utils/Logger';
import { LocationAccessProvider } from './context/LocationAccessContext';
import { AlertProvider } from './context/AlertContext';
import { TripStateProvider } from './context/TripStateContext';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from './components/common/AppText';
import { AppPressable as TouchableOpacity } from './components/common/AppPressable';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { colors, spacing, borderRadius, sizes, typography } from './theme';

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
  sendDefaultPii: false,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  profilesSampleRate: __DEV__ ? 1.0 : 0.2,
  debug: __DEV__,
  enableUserInteractionTracing: false, // Disable to prevent native frames error
  enableNative: false, // Disable native integration to prevent errors
  // Defense in depth: every call site is expected to sanitize what it logs
  // (see Logger.js), but this scrubs the actual outgoing Sentry event too, in
  // case something slips through — request headers/cookies, user, extra,
  // contexts, and breadcrumb data.
  beforeSend(event) {
    if (__DEV__ && event.exception) {
      Logger.debug('App', 'Sentry Event Captured', {
        eventId: event.event_id,
        message: event.exception?.values?.[0]?.value
      });
    }

    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.authorization;
        delete event.request.headers.Cookie;
      }
    }
    if (event.user) event.user = sanitizeForRemote(event.user);
    if (event.extra) event.extra = sanitizeForRemote(event.extra);
    if (event.contexts) event.contexts = sanitizeForRemote(event.contexts);
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((crumb) => (
        crumb.data ? { ...crumb, data: sanitizeForRemote(crumb.data) } : crumb
      ));
    }

    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data) {
      breadcrumb.data = sanitizeForRemote(breadcrumb.data);
    }
    return breadcrumb;
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
      <AppButton onPress={onRetry}>Tentar novamente</AppButton>
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
    fontSize: sizes.controlLarge,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
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
        <LocationAccessProvider>
          <TripStateProvider>
            <UserLocationStateContextProvider>
              <BottomSheetModalProvider>
                <AppNav />
              </BottomSheetModalProvider>
            </UserLocationStateContextProvider>
          </TripStateProvider>
        </LocationAccessProvider>
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
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
  });
  useEffect(() => {
    if (fontError) Logger.warn('App', 'Unable to load bundled Poppins fonts', fontError);
  }, [fontError]);
  // Keep product text from rendering in a fallback face during font loading.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider><StatusBar style="dark" /><AppWithContexts /></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

